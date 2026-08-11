const request = require('supertest');
const { v4: uuidv4 } = require('uuid');

jest.mock('../integrations/mercadopago');
const mercadopago = require('../integrations/mercadopago');

const app = require('../app');
const { sequelize, Category, Product, ProductVariant, Order, Payment, User } = require('../models');

let variantId;

async function registerAndLogin(email) {
  await request(app).post('/v1/register').send({
    name: 'Cliente Conta', email, password: 'senha1234', cpf: `${Date.now()}`.slice(0, 11), phone: '85999999999',
  });
  const res = await request(app).post('/v1/login').send({ email, password: 'senha1234' });
  return res.body.access_token;
}

async function createAddress(token) {
  const res = await request(app).post('/v1/addresses').set('Authorization', `Bearer ${token}`).send({
    street: 'Rua Conta', number: '1', neighborhood: 'Centro', city: 'Fortaleza', state: 'CE', zip: '60000-000',
  });
  return res.body.id;
}

async function createOrder(token) {
  await request(app).post('/v1/cart/items').set('Authorization', `Bearer ${token}`).send({ variant_id: variantId, quantity: 1 });
  const addressId = await createAddress(token);
  const res = await request(app).post('/v1/orders').set('Authorization', `Bearer ${token}`).send({
    address_id: addressId, shipping_option_id: 'uberflex',
  });
  return res.body;
}

beforeAll(async () => {
  await sequelize.authenticate();
  const category = await Category.create({ name: 'Categoria Conta', slug: `categoria-conta-${uuidv4()}` });
  const product = await Product.create({ categoryId: category.id, name: 'Produto Conta', slug: `produto-conta-${uuidv4()}`, basePrice: 80, active: true });
  const variant = await ProductVariant.create({ productId: product.id, size: 'M', color: 'Preto', sku: `SKU-CONTA-${uuidv4()}`, stockQuantity: 10 });
  variantId = variant.id;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Conta do usuário', () => {
  it('retorna o perfil do usuário autenticado', async () => {
    const token = await registerAndLogin(`perfil-${Date.now()}@teste.com`);
    const res = await request(app).get('/v1/account').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Cliente Conta');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('atualiza nome e telefone', async () => {
    const token = await registerAndLogin(`update-${Date.now()}@teste.com`);
    const res = await request(app).put('/v1/account').set('Authorization', `Bearer ${token}`).send({ name: 'Nome Novo', phone: '85888887777' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Nome Novo');
    expect(res.body.phone).toBe('85888887777');
  });

  it('troca a senha com sucesso e permite login com a nova senha', async () => {
    const email = `senha-${Date.now()}@teste.com`;
    const token = await registerAndLogin(email);

    const change = await request(app).put('/v1/account/password').set('Authorization', `Bearer ${token}`).send({
      current_password: 'senha1234', new_password: 'novaSenha123',
    });
    expect(change.status).toBe(200);

    const loginOld = await request(app).post('/v1/login').send({ email, password: 'senha1234' });
    expect(loginOld.status).toBe(401);

    const loginNew = await request(app).post('/v1/login').send({ email, password: 'novaSenha123' });
    expect(loginNew.status).toBe(200);
  });

  it('rejeita troca de senha com senha atual incorreta', async () => {
    const token = await registerAndLogin(`senha-errada-${Date.now()}@teste.com`);
    const res = await request(app).put('/v1/account/password').set('Authorization', `Bearer ${token}`).send({
      current_password: 'senhaErrada', new_password: 'novaSenha123',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('invalid_current_password');
  });
});

describe('Cancelamento e exclusão de pedido pelo cliente', () => {
  it('cliente cancela pedido aguardando pagamento e o estoque é liberado', async () => {
    const token = await registerAndLogin(`cancela-${Date.now()}@teste.com`);
    const before = await ProductVariant.findByPk(variantId);
    const order = await createOrder(token);

    const res = await request(app).post(`/v1/orders/${order.id}/cancel`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelado');

    const afterVariant = await ProductVariant.findByPk(variantId);
    expect(afterVariant.stockQuantity).toBe(before.stockQuantity);
  });

  it('cliente não consegue cancelar pedido de outro cliente', async () => {
    const tokenA = await registerAndLogin(`dono-${Date.now()}@teste.com`);
    const order = await createOrder(tokenA);

    const tokenB = await registerAndLogin(`intruso-${Date.now()}@teste.com`);
    const res = await request(app).post(`/v1/orders/${order.id}/cancel`).set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });

  it('cliente exclui pedido aguardando pagamento (remove do banco)', async () => {
    const token = await registerAndLogin(`exclui-${Date.now()}@teste.com`);
    const order = await createOrder(token);

    const res = await request(app).delete(`/v1/orders/${order.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);

    const stillExists = await Order.findByPk(order.id);
    expect(stillExists).toBeNull();
  });

  it('não permite excluir pedido já pago', async () => {
    const token = await registerAndLogin(`nao-exclui-pago-${Date.now()}@teste.com`);
    const order = await createOrder(token);
    await Order.update({ status: 'pago' }, { where: { id: order.id } });

    const res = await request(app).delete(`/v1/orders/${order.id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('order_not_deletable');

    const stillExists = await Order.findByPk(order.id);
    expect(stillExists).not.toBeNull();
  });

  it('não permite cancelar pedido já entregue', async () => {
    const token = await registerAndLogin(`nao-cancela-entregue-${Date.now()}@teste.com`);
    const order = await createOrder(token);
    await Order.update({ status: 'entregue' }, { where: { id: order.id } });

    const res = await request(app).post(`/v1/orders/${order.id}/cancel`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('order_not_cancelable');
  });

  it('cancelamento de pedido pago aciona estorno automático', async () => {
    mercadopago.createPixPayment.mockResolvedValue({
      id: Date.now(),
      status: 'pending',
      point_of_interaction: { transaction_data: { qr_code_base64: 'x', qr_code: 'y' } },
    });
    mercadopago.refundPayment.mockResolvedValue({ status: 'refunded' });

    const token = await registerAndLogin(`estorno-${Date.now()}@teste.com`);
    const order = await createOrder(token);
    await request(app).post('/v1/payments/pix').set('Authorization', `Bearer ${token}`).send({ order_id: order.id });
    // Simula a aprovação do pagamento (o que confirmOrderPaid faria de verdade
    // via webhook/consulta) para exercitar o cenário real de estorno.
    await Payment.update({ status: 'approved' }, { where: { orderId: order.id } });
    await Order.update({ status: 'pago' }, { where: { id: order.id } });

    const res = await request(app).post(`/v1/orders/${order.id}/cancel`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(mercadopago.refundPayment).toHaveBeenCalled();
  });

  it('admin confirma pagamento manualmente (aguardando_pagamento -> pago)', async () => {
    const token = await registerAndLogin(`confirma-manual-${Date.now()}@teste.com`);
    const order = await createOrder(token);

    const adminEmail = `admin-confirma-${Date.now()}@teste.com`;
    await registerAndLogin(adminEmail);
    await User.update({ role: 'admin' }, { where: { email: adminEmail } });
    const adminLogin = await request(app).post('/v1/login').send({ email: adminEmail, password: 'senha1234' });

    const res = await request(app)
      .put(`/v1/admin/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${adminLogin.body.access_token}`)
      .send({ status: 'pago' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pago');
  });

  it('admin reembolsa pedido entregue diretamente, sem passar por cancelado, e o estorno é acionado', async () => {
    mercadopago.createPixPayment.mockResolvedValue({
      id: Date.now(),
      status: 'pending',
      point_of_interaction: { transaction_data: { qr_code_base64: 'x', qr_code: 'y' } },
    });
    mercadopago.refundPayment.mockResolvedValue({ status: 'refunded' });

    const token = await registerAndLogin(`entrega-reembolso-${Date.now()}@teste.com`);
    const order = await createOrder(token);
    await request(app).post('/v1/payments/pix').set('Authorization', `Bearer ${token}`).send({ order_id: order.id });
    await Payment.update({ status: 'approved' }, { where: { orderId: order.id } });
    await Order.update({ status: 'entregue' }, { where: { id: order.id } });

    const adminEmail = `admin-entrega-reembolso-${Date.now()}@teste.com`;
    await registerAndLogin(adminEmail);
    await User.update({ role: 'admin' }, { where: { email: adminEmail } });
    const adminLogin = await request(app).post('/v1/login').send({ email: adminEmail, password: 'senha1234' });

    const res = await request(app)
      .put(`/v1/admin/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${adminLogin.body.access_token}`)
      .send({ status: 'reembolsado' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('reembolsado');
    expect(mercadopago.refundPayment).toHaveBeenCalled();
  });
});
