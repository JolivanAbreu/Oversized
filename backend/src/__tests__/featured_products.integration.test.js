const request = require('supertest');
const { v4: uuidv4 } = require('uuid');

const app = require('../app');
const { sequelize, User, Category, Product, ProductVariant } = require('../models');

async function makeAdmin(email) {
  await request(app).post('/v1/register').send({
    name: 'Admin Destaque', email, password: 'senha1234', cpf: `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 11), phone: '85999999999',
  });
  await User.update({ role: 'admin' }, { where: { email } });
  const login = await request(app).post('/v1/login').send({ email, password: 'senha1234' });
  return login.body.access_token;
}

beforeAll(async () => {
  await sequelize.authenticate();
});

afterAll(async () => {
  await sequelize.close();
});

describe('Produtos em destaque (banner / destaque)', () => {
  it('admin marca um produto para o banner e ele aparece em /products/featured?slot=banner', async () => {
    const adminToken = await makeAdmin(`admin-banner-${Date.now()}@teste.com`);
    const category = await Category.create({ name: 'Cat Banner', slug: `cat-banner-${uuidv4()}` });
    const product = await Product.create({ categoryId: category.id, name: 'Produto Banner', slug: `produto-banner-${uuidv4()}`, basePrice: 90, active: true });
    await ProductVariant.create({ productId: product.id, size: 'M', color: 'Preto', sku: `SKU-BANNER-${uuidv4()}`, stockQuantity: 5 });

    const update = await request(app).put(`/v1/admin/products/${product.id}`).set('Authorization', `Bearer ${adminToken}`).send({ featuredSlot: 'banner' });
    expect(update.status).toBe(200);
    expect(update.body.featuredSlot).toBe('banner');

    const res = await request(app).get('/v1/products/featured').query({ slot: 'banner' });
    expect(res.status).toBe(200);
    expect(res.body.some((p) => p.id === product.id)).toBe(true);
  });

  it('admin marca um produto para destaque e ele aparece em /products/featured?slot=destaque, não no banner', async () => {
    const adminToken = await makeAdmin(`admin-destaque-${Date.now()}@teste.com`);
    const category = await Category.create({ name: 'Cat Destaque', slug: `cat-destaque-${uuidv4()}` });
    const product = await Product.create({ categoryId: category.id, name: 'Produto Destaque', slug: `produto-destaque-${uuidv4()}`, basePrice: 90, active: true });

    await request(app).put(`/v1/admin/products/${product.id}`).set('Authorization', `Bearer ${adminToken}`).send({ featuredSlot: 'destaque' });

    const destaque = await request(app).get('/v1/products/featured').query({ slot: 'destaque' });
    expect(destaque.body.some((p) => p.id === product.id)).toBe(true);

    const banner = await request(app).get('/v1/products/featured').query({ slot: 'banner' });
    expect(banner.body.some((p) => p.id === product.id)).toBe(false);
  });

  it('produto inativo marcado como destaque não aparece na vitrine', async () => {
    const adminToken = await makeAdmin(`admin-inativo-${Date.now()}@teste.com`);
    const category = await Category.create({ name: 'Cat Inativo', slug: `cat-inativo-${uuidv4()}` });
    const product = await Product.create({ categoryId: category.id, name: 'Produto Inativo Destaque', slug: `produto-inativo-destaque-${uuidv4()}`, basePrice: 90, active: false, featuredSlot: 'banner' });

    const res = await request(app).get('/v1/products/featured').query({ slot: 'banner' });
    expect(res.body.some((p) => p.id === product.id)).toBe(false);
  });

  it('rejeita slot inválido', async () => {
    const res = await request(app).get('/v1/products/featured').query({ slot: 'qualquer-coisa' });
    expect(res.status).toBe(400);
  });

  it('admin define um rótulo de destaque livre (badgeLabel) e ele aparece na loja pública', async () => {
    const adminToken = await makeAdmin(`admin-badge-${Date.now()}@teste.com`);
    const category = await Category.create({ name: 'Cat Badge', slug: `cat-badge-${uuidv4()}` });
    const product = await Product.create({ categoryId: category.id, name: 'Produto Badge', slug: `produto-badge-${uuidv4()}`, basePrice: 90, active: true });

    const update = await request(app).put(`/v1/admin/products/${product.id}`).set('Authorization', `Bearer ${adminToken}`).send({ badgeLabel: 'LANÇAMENTO' });
    expect(update.status).toBe(200);
    expect(update.body.badgeLabel).toBe('LANÇAMENTO');

    const publicRes = await request(app).get(`/v1/products/${product.slug}`);
    expect(publicRes.body.badgeLabel).toBe('LANÇAMENTO');
  });
});
