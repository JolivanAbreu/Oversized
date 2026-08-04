const crypto = require('crypto');

process.env.MERCADOPAGO_WEBHOOK_SECRET = 'segredo-de-teste';
process.env.MERCADOPAGO_ACCESS_TOKEN = 'TEST-token';

const { isValidWebhookSignature } = require('../integrations/mercadopago');

function buildValidSignature({ dataId, xRequestId, ts }) {
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const v1 = crypto.createHmac('sha256', process.env.MERCADOPAGO_WEBHOOK_SECRET).update(manifest).digest('hex');
  return `ts=${ts},v1=${v1}`;
}

// CT-24 e CT-25 (correlatos): assinatura inválida deve ser rejeitada; assinatura
// válida deve ser aceita, permitindo o processamento idempotente do webhook.
describe('isValidWebhookSignature', () => {
  it('aceita uma assinatura válida', () => {
    const dataId = '123456789';
    const xRequestId = 'req-abc';
    const ts = String(Date.now());
    const xSignature = buildValidSignature({ dataId, xRequestId, ts });

    expect(isValidWebhookSignature({ xSignature, xRequestId, dataId })).toBe(true);
  });

  it('rejeita uma assinatura com hash incorreto', () => {
    const xSignature = 'ts=123,v1=hashinvalido';
    expect(isValidWebhookSignature({ xSignature, xRequestId: 'req-abc', dataId: '123456789' })).toBe(false);
  });

  it('rejeita quando o header de assinatura está ausente', () => {
    expect(isValidWebhookSignature({ xSignature: undefined, xRequestId: 'req-abc', dataId: '123' })).toBe(false);
  });

  it('rejeita quando o dataId usado no cálculo é diferente do informado', () => {
    const ts = String(Date.now());
    const xSignature = buildValidSignature({ dataId: '999', xRequestId: 'req-abc', ts });
    expect(isValidWebhookSignature({ xSignature, xRequestId: 'req-abc', dataId: '123456789' })).toBe(false);
  });
});
