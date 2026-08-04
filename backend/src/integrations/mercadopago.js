const { MercadoPagoConfig, Payment } = require('mercadopago');
const crypto = require('crypto');

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: { timeout: 8000 },
});

const paymentClient = new Payment(client);

/**
 * Cria um pagamento com cartão de crédito usando o token gerado no navegador
 * pelo SDK JS do Mercado Pago (Checkout Transparente). Os dados do cartão nunca
 * passam pelo nosso backend — apenas o token.
 */
async function createCardPayment({ token, installments, transactionAmount, description, payer, externalReference }) {
  return paymentClient.create({
    body: {
      token,
      installments,
      transaction_amount: transactionAmount,
      description,
      payer,
      external_reference: externalReference,
      // idempotência do lado do Mercado Pago
      notification_url: `${process.env.API_PUBLIC_URL || ''}/v1/webhooks/mercadopago`,
    },
  });
}

/**
 * Cria uma cobrança Pix. O Mercado Pago retorna o QR Code (base64) e o código
 * "copia e cola" prontos para exibição no frontend.
 */
async function createPixPayment({ transactionAmount, description, payer, externalReference }) {
  return paymentClient.create({
    body: {
      transaction_amount: transactionAmount,
      description,
      payment_method_id: 'pix',
      payer,
      external_reference: externalReference,
      notification_url: `${process.env.API_PUBLIC_URL || ''}/v1/webhooks/mercadopago`,
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
