const { MercadoPagoConfig, Payment } = require('mercadopago');
const crypto = require('crypto');

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: { timeout: 8000 },
});

const paymentClient = new Payment(client);

/**
 * Monta a notification_url apenas quando há uma URL pública válida
 * configurada. Em ambiente local (localhost/127.0.0.1) o Mercado Pago nunca
 * conseguiria alcançar o webhook mesmo assim — e enviar uma URL relativa ou
 * inválida faz a própria criação do pagamento falhar ("notification_url
 * attribute must be url valid"). Por isso omitimos o campo nesses casos: o
 * pagamento continua funcionando normalmente, só não dispara webhook — o
 * app já tem um fallback de consulta direta de status (polling) para cobrir
 * exatamente esse cenário.
 */
function buildNotificationUrl() {
  const base = process.env.API_PUBLIC_URL || '';
  if (!base) return undefined;
  try {
    const url = new URL(base);
    const isLocal = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    if (isLocal) return undefined;
    return `${base.replace(/\/$/, '')}/v1/webhooks/mercadopago`;
  } catch (err) {
    return undefined; // API_PUBLIC_URL mal formada — melhor omitir do que quebrar o pagamento
  }
}

/**
 * Cria um pagamento com cartão de crédito usando o token gerado no navegador
 * pelo SDK JS do Mercado Pago (Checkout Transparente). Os dados do cartão nunca
 * passam pelo nosso backend — apenas o token.
 */
async function createCardPayment({ token, installments, transactionAmount, description, payer, externalReference }) {
  const notificationUrl = buildNotificationUrl();
  return paymentClient.create({
    body: {
      token,
      installments,
      transaction_amount: transactionAmount,
      description,
      payer,
      external_reference: externalReference,
      // idempotência do lado do Mercado Pago
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
    },
  });
}

/**
 * Cria uma cobrança Pix. O Mercado Pago retorna o QR Code (base64) e o código
 * "copia e cola" prontos para exibição no frontend.
 */
async function createPixPayment({ transactionAmount, description, payer, externalReference }) {
  const notificationUrl = buildNotificationUrl();
  return paymentClient.create({
    body: {
      transaction_amount: transactionAmount,
      description,
      payment_method_id: 'pix',
      payer,
      external_reference: externalReference,
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
    },
  });
}

async function getPayment(paymentId) {
  return paymentClient.get({ id: paymentId });
}

async function refundPayment(paymentId) {
  return paymentClient.refund({ id: paymentId });
}

/**
 * Valida a assinatura enviada pelo Mercado Pago no header x-signature,
 * conforme documentação oficial de webhooks (RNF-08). Nunca processar um
 * webhook sem essa validação.
 */
function isValidWebhookSignature({ xSignature, xRequestId, dataId }) {
  if (!xSignature || !xRequestId) return false;

  const parts = Object.fromEntries(
    xSignature.split(',').map((p) => p.trim().split('=').map((s) => s.trim()))
  );
  const { ts, v1 } = parts;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmac = crypto
    .createHmac('sha256', process.env.MERCADOPAGO_WEBHOOK_SECRET)
    .update(manifest)
    .digest('hex');

  const expected = Buffer.from(hmac);
  const received = Buffer.from(v1);
  // timingSafeEqual exige buffers do mesmo tamanho — um v1 malformado/adulterado
  // não deve derrubar a requisição, apenas ser tratado como assinatura inválida.
  if (expected.length !== received.length) return false;

  return crypto.timingSafeEqual(expected, received);
}

module.exports = {
  createCardPayment,
  createPixPayment,
  getPayment,
  refundPayment,
  isValidWebhookSignature,
};
