// Mocka o pacote oficial do Mercado Pago para inspecionar exatamente o body
// enviado ao criar um pagamento, sem fazer nenhuma chamada de rede real.
const mockCreate = jest.fn().mockResolvedValue({ id: 1, status: 'pending' });

jest.mock('mercadopago', () => ({
  MercadoPagoConfig: jest.fn().mockImplementation(() => ({})),
  Payment: jest.fn().mockImplementation(() => ({ create: mockCreate, get: jest.fn(), refund: jest.fn() })),
}));

describe('notification_url do Mercado Pago', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    delete process.env.API_PUBLIC_URL;
    jest.resetModules();
  });

  it('omite notification_url quando API_PUBLIC_URL não está configurada (causa raiz do bug relatado)', async () => {
    process.env.API_PUBLIC_URL = '';
    const mercadopago = require('../integrations/mercadopago');

    await mercadopago.createPixPayment({ transactionAmount: 10, description: 'x', payer: {}, externalReference: 'o1' });

    const body = mockCreate.mock.calls[0][0].body;
    expect(body).not.toHaveProperty('notification_url');
  });

  it('omite notification_url quando API_PUBLIC_URL aponta para localhost (Mercado Pago não alcançaria)', async () => {
    process.env.API_PUBLIC_URL = 'http://localhost:3000';
    const mercadopago = require('../integrations/mercadopago');

    await mercadopago.createCardPayment({ token: 't', installments: 1, transactionAmount: 10, description: 'x', payer: {}, externalReference: 'o1' });

    const body = mockCreate.mock.calls[0][0].body;
    expect(body).not.toHaveProperty('notification_url');
  });

  it('inclui notification_url válida quando API_PUBLIC_URL é uma URL pública real', async () => {
    process.env.API_PUBLIC_URL = 'https://api.blusaoversized.com.br';
    const mercadopago = require('../integrations/mercadopago');

    await mercadopago.createPixPayment({ transactionAmount: 10, description: 'x', payer: {}, externalReference: 'o1' });

    const body = mockCreate.mock.calls[0][0].body;
    expect(body.notification_url).toBe('https://api.blusaoversized.com.br/v1/webhooks/mercadopago');
  });

  it('nunca lança erro mesmo com API_PUBLIC_URL malformada — apenas omite o campo', async () => {
    process.env.API_PUBLIC_URL = 'isso-nao-e-uma-url';
    const mercadopago = require('../integrations/mercadopago');

    await expect(
      mercadopago.createPixPayment({ transactionAmount: 10, description: 'x', payer: {}, externalReference: 'o1' })
    ).resolves.toBeDefined();

    const body = mockCreate.mock.calls[0][0].body;
    expect(body).not.toHaveProperty('notification_url');
  });
});
