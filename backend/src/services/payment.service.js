const { Order, Payment, User, sequelize } = require('../models');
const ApiError = require('../utils/apiError');
const mercadopago = require('../integrations/mercadopago');
const emailService = require('./email.service');
const orderService = require('./order.service');

const PIX_EXPIRATION_MINUTES = 30;

async function assertOrderPayable(order) {
  if (order.status !== 'aguardando_pagamento') {
    throw ApiError.conflict('Este pedido não está aguardando pagamento', 'order_not_payable');
  }
}

/**
 * Envolve qualquer chamada à API do Mercado Pago: falhas de rede, timeout,
 * credenciais inválidas ou respostas fora do formato esperado nunca devem
 * vazar como erro 500 genérico (ou expor detalhes internos ao cliente) — são
 * traduzidas para um 502 com uma mensagem segura e acionável.
 */
async function callMercadoPago(fn) {
  try {
    return await fn();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[mercadopago] falha na comunicação com a API:', err.message);
    throw new ApiError(502, 'payment_provider_unavailable', 'Não foi possível processar o pagamento no momento. Tente novamente em instantes.');
  }
}

/**
 * Processa pagamento com cartão de crédito (RF-20). O token já foi gerado no
 * navegador do cliente pelo SDK do Mercado Pago — o backend nunca recebe
 * número de cartão, validade ou CVV (RNF-06).
 */
async function payWithCard(userId, { orderId, cardToken, installments }) {
  const order = await Order.findOne({ where: { id: orderId, userId } });
  if (!order) throw ApiError.notFound('Pedido não encontrado');
  await assertOrderPayable(order);

  const user = await User.findByPk(userId);

  const mpResponse = await callMercadoPago(() => mercadopago.createCardPayment({
    token: cardToken,
    installments,
    transactionAmount: Number(order.total),
    description: `Pedido ${order.orderNumber} — Dravennx`,
    payer: { email: user.email },
    externalReference: order.id,
  }));

  const payment = await Payment.create({
    orderId: order.id,
    method: 'card',
    providerPaymentId: String(mpResponse.id),
    status: mapMpStatus(mpResponse.status),
    amount: order.total,
    installments,
  });

  if (payment.status === 'rejected') {
    throw ApiError.paymentRequired('Pagamento recusado pela operadora do cartão', 'card_payment_rejected');
  }
  if (payment.status === 'approved') {
    await confirmOrderPaid(order.id, payment);
  }

  return payment;
}

/**
 * Gera cobrança Pix (RF-21): retorna QR Code em base64 e código copia-e-cola,
 * ambos fornecidos diretamente pelo Mercado Pago, com expiração de 30 minutos.
 */
async function payWithPix(userId, { orderId }) {
  const order = await Order.findOne({ where: { id: orderId, userId } });
  if (!order) throw ApiError.notFound('Pedido não encontrado');
  await assertOrderPayable(order);

  const user = await User.findByPk(userId);

  const mpResponse = await callMercadoPago(() => mercadopago.createPixPayment({
    transactionAmount: Number(order.total),
    description: `Pedido ${order.orderNumber} — Dravennx`,
    payer: { email: user.email },
    externalReference: order.id,
  }));

  const expiresAt = new Date(Date.now() + PIX_EXPIRATION_MINUTES * 60 * 1000);
  const txData = mpResponse.point_of_interaction?.transaction_data || {};

  const payment = await Payment.create({
    orderId: order.id,
    method: 'pix',
    providerPaymentId: String(mpResponse.id),
    status: mapMpStatus(mpResponse.status),
    amount: order.total,
    pixQrCode: txData.qr_code_base64,
    pixCopyPaste: txData.qr_code,
    pixExpiration: expiresAt,
  });

  return payment;
}

async function getPaymentStatus(paymentId) {
  const payment = await Payment.findByPk(paymentId);
  if (!payment) throw ApiError.notFound('Pagamento não encontrado');
  return payment;
}

function mapMpStatus(mpStatus) {
  // Mapeia os status do Mercado Pago para o enum interno de payments.status
  if (mpStatus === 'approved') return 'approved';
  if (['rejected', 'cancelled'].includes(mpStatus)) return 'rejected';
  if (mpStatus === 'refunded' || mpStatus === 'charged_back') return 'refunded';
  return 'pending';
}

async function confirmOrderPaid(orderId, payment) {
  return sequelize.transaction(async (transaction) => {
    const order = await Order.findByPk(orderId, { transaction });
    if (!order || order.status !== 'aguardando_pagamento') return; // idempotência: já processado

    order.status = 'pago';
    await order.save({ transaction });

    payment.paidAt = new Date();
    await payment.save({ transaction });

    const user = await User.findByPk(order.userId, { transaction });
    // Fire-and-forget: mesma razão do order.service.js — confirmação de
    // pagamento não pode esperar o SMTP responder.
    emailService.sendOrderStatusUpdate(user, order).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[email] falha ao notificar pagamento confirmado', err.message);
    });
  });
}

/**
 * Processa a notificação assíncrona do Mercado Pago (RF-22). Nunca confia
 * apenas no payload recebido: sempre consulta a API oficial para confirmar o
 * status antes de atualizar o pedido, e trata reenvios de forma idempotente
 * (RNF-12) verificando se o pagamento já está no status recebido.
 */
async function handleWebhook({ dataId, xSignature, xRequestId }) {
  const isValid = mercadopago.isValidWebhookSignature({ xSignature, xRequestId, dataId });
  if (!isValid) {
    throw ApiError.unauthorized('Assinatura de webhook inválida', 'invalid_webhook_signature');
  }

  const mpPayment = await callMercadoPago(() => mercadopago.getPayment(dataId));
  const payment = await Payment.findOne({ where: { providerPaymentId: String(dataId) } });
  if (!payment) {
    // Pagamento não reconhecido — ignora silenciosamente (pode ser de outro sistema/teste)
    return { ignored: true };
  }

  const newStatus = mapMpStatus(mpPayment.status);
  if (payment.status === newStatus) {
    return { alreadyProcessed: true }; // idempotência: evento duplicado
  }

  payment.status = newStatus;
  await payment.save();

  if (newStatus === 'approved') {
    await confirmOrderPaid(payment.orderId, payment);
  } else if (newStatus === 'rejected') {
    // Libera o estoque reservado quando o pagamento é definitivamente recusado
    const order = await Order.findByPk(payment.orderId);
    if (order && order.status === 'aguardando_pagamento') {
      await orderService.releaseOrderStock(order);
    }
  }

  return { processed: true, status: newStatus };
}

/**
 * Aciona o estorno junto ao Mercado Pago quando um pedido pago é cancelado
 * (RF-29, RN-06).
 */
async function refundOrderPayment(orderId) {
  const payment = await Payment.findOne({ where: { orderId, status: 'approved' }, order: [['createdAt', 'DESC']] });
  if (!payment) return null;

  await callMercadoPago(() => mercadopago.refundPayment(payment.providerPaymentId));
  payment.status = 'refunded';
  await payment.save();
  return payment;
}

module.exports = {
  payWithCard,
  payWithPix,
  getPaymentStatus,
  handleWebhook,
  refundOrderPayment,
  mapMpStatus,
};
