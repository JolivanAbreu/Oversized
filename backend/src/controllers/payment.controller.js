const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const paymentService = require('../services/payment.service');

const payWithCard = asyncHandler(async (req, res) => {
  const { order_id: orderId, card_token: cardToken, installments } = req.body;
  if (!orderId || !cardToken || !installments) {
    throw ApiError.badRequest('order_id, card_token e installments são obrigatórios');
  }

  const payment = await paymentService.payWithCard(req.user.id, { orderId, cardToken, installments: Number(installments) });
  res.status(201).json(payment);
});

const payWithPix = asyncHandler(async (req, res) => {
  const { order_id: orderId } = req.body;
  if (!orderId) throw ApiError.badRequest('order_id é obrigatório');

  const payment = await paymentService.payWithPix(req.user.id, { orderId });
  res.status(201).json({
    payment_id: payment.id,
    qr_code_base64: payment.pixQrCode,
    copy_paste_code: payment.pixCopyPaste,
    expires_at: payment.pixExpiration,
  });
});

const status = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentStatus(req.params.id);
  res.json({ id: payment.id, status: payment.status, method: payment.method, paid_at: payment.paidAt });
});

/**
 * Endpoint chamado pelo Mercado Pago. Não usa o middleware de autenticação
 * JWT — a validação de origem é feita via assinatura HMAC no service
 * (RNF-08), verificada antes de qualquer processamento.
 */
const webhook = asyncHandler(async (req, res) => {
  const dataId = req.query['data.id'] || req.body?.data?.id;
  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];

  if (!dataId) {
    // Requisição de teste/validação do painel do Mercado Pago sem payload real
    return res.status(200).json({ received: true });
  }

  try {
    const result = await paymentService.handleWebhook({ dataId, xSignature, xRequestId });
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      return res.status(401).json({ error: err.code, message: err.message });
    }
    throw err;
  }
});

module.exports = { payWithCard, payWithPix, status, webhook };
