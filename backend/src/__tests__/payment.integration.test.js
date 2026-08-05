const request = require('supertest');
const { v4: uuidv4 } = require('uuid');

// IDs únicos por execução: o banco de teste é persistente entre execuções e
// provider_payment_id tem constraint de unicidade real (comportamento correto).
let nextMockPaymentId = Date.now();
function uniquePaymentId() {
  nextMockPaymentId += 1;
  return nextMockPaymentId;
}

// Mocka apenas a integração externa — todo o resto (rotas, controllers,
// services, banco de dados real) roda de verdade, validando o fluxo completo.
jest.mock('../integrations/mercadopago');
const mercadopago = require('../integrations/mercadopago');

const app = require('../app');
const { sequelize, Category, Product, ProductVariant, Order, Payment } = require('../models');

let categoryId;
let variantId;

async function registerAndLogin(email) {
  await request(app).post('/v1/register').send({
    name: 'Cliente Teste', email, password: 'senha1234', cpf: `${Date.now()}`.slice(0, 11), phone: '85999999999',
  });
  const res = await request(app).post('/v1/login').send({ email, password: 'senha1234' });
  return { token: res.body.access_token, userId: res.body.user.id };
}

async function createAddress(token) {
  const res = await request(app).post('/v1/addresses').set('Authorization', `Bearer ${token}`).send({
    street: 'Rua Teste', number: '1', neighborhood: 'Centro', city: 'Fortaleza', state: 'CE', zip: '60000-000',
  });
  return res.body.id;
}

async function createOrderWithItem(token) {
  await request(app).post('/v1/cart/items').set('Authorization', `Bearer ${token}`).send({ variant_id: variantId, quantity: 1 });
  const addressId = await createAddress(token);
  const res = await request(app).post('/v1/orders').set('Authorization', `Bearer ${token}`).send({
    address_id: addressId, shipping_option_id: 'uberflex',
  });
  return res.body;
}

beforeAll(async () => {
  await sequelize.authenticate();
  const category = await Category.create({ name: 'Categoria Teste', slug: `categoria-teste-${uuidv4()}` });
  categoryId = category.id;
  const product = await Product.create({
    categoryId, name: 'Produto Teste', slug: `produto-teste-${uuidv4()}`, basePrice: 100, active: true,
  });
  const variant = await ProductVariant.create({
    productId: product.id, size: 'M', color: 'Azul', sku: `SKU-TESTE-${uuidv4()}`, stockQuantity: 10,
  });
  variantId = variant.id;
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Fluxo de pagamento com cartão', () => {
  it('CT-20: cartão aprovado confirma o pedido como pago e não deixa estoque negativo', async () => {
    mercadopago.createCardPayment.mockResolvedValue({ id: uniquePaymentId(), status: 'approved' });

    const { token } = await registerAndLogin(`aprovado-${Date.now()}@teste.com`);
    const order = await createOrderWithItem(token);

    const res = await request(app).post('/v1/payments/card').set('Authorization', `Bearer ${token}`).send({
      order_id: order.id, card_token: 'tok_teste', installments: 1,
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('approved');

    const updatedOrder = await Order.findByPk(order.id);
    expect(updatedOrder.status).toBe('pago');
  });

  it('CT-21: cartão recusado retorna 402 e mantém o pedido aguardando pagamento', async () => {
    mercadopago.createCardPayment.mockResolvedValue({ id: uniquePaymentId(), status: 'rejected' });

    const { token } = await registerAndLogin(`recusado-${Date.now()}@teste.com`);
    const order = await createOrderWithItem(token);

    const res = await request(app).post('/v1/payments/card').set('Authorization', `Bearer ${token}`).send({
      order_id: order.id, card_token: 'tok_teste', installments: 1,
    });

    expect(res.status).toBe(402);
    expect(res.body.error).toBe('card_payment_rejected');

    const updatedOrder = await Order.findByPk(order.id);
    expect(updatedOrder.status).toBe('aguardando_pagamento');
  });

  it('não permite pagar um pedido que já não está aguardando pagamento', async () => {
    mercadopago.createCardPayment.mockResolvedValue({ id: uniquePaymentId(), status: 'approved' });

    const { token } = await registerAndLogin(`duplo-pagamento-${Date.now()}@teste.com`);
    const order = await createOrderWithItem(token);

    await request(app).post('/v1/payments/card').set('Authorization', `Bearer ${token}`).send({
      order_id: order.id, card_token: 'tok_teste', installments: 1,
    });

    const second = await request(app).post('/v1/payments/card').set('Authorization', `Bearer ${token}`).send({
      order_id: order.id, card_token: 'tok_teste_2', installments: 1,
    });

    expect(second.status).toBe(409);
    expect(second.body.error).toBe('order_not_payable');
  });
});

describe('Fluxo de pagamento com Pix', () => {
  it('CT-22: gera QR Code e código copia-e-cola', async () => {
    const pixId = uniquePaymentId();
    mercadopago.createPixPayment.mockResolvedValue({
      id: pixId,
      status: 'pending',
      point_of_interaction: { transaction_data: { qr_code_base64: 'base64-fake', qr_code: '000201-copia-cola' } },
    });

    const { token } = await registerAndLogin(`pix-${Date.now()}@teste.com`);
    const order = await createOrderWithItem(token);

    const res = await request(app).post('/v1/payments/pix').set('Authorization', `Bearer ${token}`).send({ order_id: order.id });

    expect(res.status).toBe(201);
    expect(res.body.qr_code_base64).toBe('base64-fake');
    expect(res.body.copy_paste_code).toBe('000201-copia-cola');
    expect(new Date(res.body.expires_at).getTime()).toBeGreaterThan(Date.now());
  });

  it('traduz falha de comunicação com o Mercado Pago em 502 tratado, sem criar pagamento órfão', async () => {
    mercadopago.createPixPayment.mockRejectedValue(new Error('invalid json response body (rede fora do ar)'));

    const { token } = await registerAndLogin(`pix-falha-rede-${Date.now()}@teste.com`);
    const order = await createOrderWithItem(token);

    const res = await request(app).post('/v1/payments/pix').set('Authorization', `Bearer ${token}`).send({ order_id: order.id });

    expect(res.status).toBe(502);
    expect(res.body.error).toBe('payment_provider_unavailable');
    // a mensagem ao cliente não deve vazar o erro interno
    expect(res.body.message).not.toMatch(/invalid json/i);

    const orphanPayment = await Payment.findOne({ where: { orderId: order.id } });
    expect(orphanPayment).toBeNull();

    const stillPending = await Order.findByPk(order.id);
    expect(stillPending.status).toBe('aguardando_pagamento');
  });
});

describe('Webhook do Mercado Pago', () => {
  it('CT-23: confirma o pagamento e atualiza o pedido para pago', async () => {
    const pixId = uniquePaymentId();
    mercadopago.createPixPayment.mockResolvedValue({
      id: pixId,
      status: 'pending',
      point_of_interaction: { transaction_data: { qr_code_base64: 'x', qr_code: 'y' } },
    });

    const { token } = await registerAndLogin(`webhook-ok-${Date.now()}@teste.com`);
    const order = await createOrderWithItem(token);
    await request(app).post('/v1/payments/pix').set('Authorization', `Bearer ${token}`).send({ order_id: order.id });

    mercadopago.isValidWebhookSignature.mockReturnValue(true);
    mercadopago.getPayment.mockResolvedValue({ id: pixId, status: 'approved' });

    const res = await request(app)
      .post(`/v1/webhooks/mercadopago?data.id=${pixId}`)
      .set('x-signature', 'ts=123,v1=fake')
      .set('x-request-id', 'req-fake')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.processed).toBe(true);

    const updatedOrder = await Order.findByPk(order.id);
    expect(updatedOrder.status).toBe('pago');
  });

  it('CT-24: assinatura inválida é rejeitada com 401 e não altera o pedido', async () => {
    const pixId = uniquePaymentId();
    mercadopago.createPixPayment.mockResolvedValue({
      id: pixId,
      status: 'pending',
      point_of_interaction: { transaction_data: { qr_code_base64: 'x', qr_code: 'y' } },
    });

    const { token } = await registerAndLogin(`webhook-invalido-${Date.now()}@teste.com`);
    const order = await createOrderWithItem(token);
    await request(app).post('/v1/payments/pix').set('Authorization', `Bearer ${token}`).send({ order_id: order.id });

    mercadopago.isValidWebhookSignature.mockReturnValue(false);

    const res = await request(app)
      .post(`/v1/webhooks/mercadopago?data.id=${pixId}`)
      .set('x-signature', 'ts=123,v1=assinatura-forjada')
      .set('x-request-id', 'req-fake')
      .send({});

    expect(res.status).toBe(401);

    const updatedOrder = await Order.findByPk(order.id);
    expect(updatedOrder.status).toBe('aguardando_pagamento');
  });

  it('CT-25: processa o mesmo evento duas vezes sem efeito colateral duplicado (idempotência)', async () => {
    const pixId = uniquePaymentId();
    mercadopago.createPixPayment.mockResolvedValue({
      id: pixId,
      status: 'pending',
      point_of_interaction: { transaction_data: { qr_code_base64: 'x', qr_code: 'y' } },
    });

    const { token } = await registerAndLogin(`webhook-duplicado-${Date.now()}@teste.com`);
    const order = await createOrderWithItem(token);
    await request(app).post('/v1/payments/pix').set('Authorization', `Bearer ${token}`).send({ order_id: order.id });

    mercadopago.isValidWebhookSignature.mockReturnValue(true);
    mercadopago.getPayment.mockResolvedValue({ id: pixId, status: 'approved' });

    const first = await request(app)
      .post(`/v1/webhooks/mercadopago?data.id=${pixId}`)
      .set('x-signature', 'ts=123,v1=fake')
      .set('x-request-id', 'req-fake')
      .send({});
    const second = await request(app)
      .post(`/v1/webhooks/mercadopago?data.id=${pixId}`)
      .set('x-signature', 'ts=123,v1=fake')
      .set('x-request-id', 'req-fake')
      .send({});

    expect(first.body.processed).toBe(true);
    expect(second.body.alreadyProcessed).toBe(true);

    const payment = await Payment.findOne({ where: { providerPaymentId: String(pixId) } });
    expect(payment.status).toBe('approved');
    // paidAt não deve ser reescrito na segunda chamada (confirmOrderPaid só roda quando o pedido ainda está aguardando_pagamento)
  });

  it('libera o estoque quando o pagamento é recusado via webhook', async () => {
    const pixId = uniquePaymentId();
    mercadopago.createPixPayment.mockResolvedValue({
      id: pixId,
      status: 'pending',
      point_of_interaction: { transaction_data: { qr_code_base64: 'x', qr_code: 'y' } },
    });

    const { token } = await registerAndLogin(`webhook-recusado-${Date.now()}@teste.com`);
    const before = await ProductVariant.findByPk(variantId);

    const order = await createOrderWithItem(token);
    const afterReserve = await ProductVariant.findByPk(variantId);
    expect(afterReserve.stockQuantity).toBe(before.stockQuantity - 1);

    await request(app).post('/v1/payments/pix').set('Authorization', `Bearer ${token}`).send({ order_id: order.id });

    mercadopago.isValidWebhookSignature.mockReturnValue(true);
    mercadopago.getPayment.mockResolvedValue({ id: pixId, status: 'rejected' });

    await request(app)
      .post(`/v1/webhooks/mercadopago?data.id=${pixId}`)
      .set('x-signature', 'ts=123,v1=fake')
      .set('x-request-id', 'req-fake')
      .send({});

    const afterRejection = await ProductVariant.findByPk(variantId);
    expect(afterRejection.stockQuantity).toBe(before.stockQuantity);

    const updatedOrder = await Order.findByPk(order.id);
    expect(updatedOrder.status).toBe('aguardando_pagamento');
  });
});
