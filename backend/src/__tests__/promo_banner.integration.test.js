const request = require('supertest');

const app = require('../app');
const { sequelize, User } = require('../models');

async function makeUser(email, role) {
  await request(app).post('/v1/register').send({
    name: 'Usuário Banner', email, password: 'senha1234', cpf: `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 11), phone: '85999999999',
  });
  if (role) await User.update({ role }, { where: { email } });
  const login = await request(app).post('/v1/login').send({ email, password: 'senha1234' });
  return login.body.access_token;
}

beforeAll(async () => {
  await sequelize.authenticate();
});

afterAll(async () => {
  await sequelize.close();
});

describe('Banner promocional da home', () => {
  it('GET /promo-banner é público e retorna um valor padrão quando o admin nunca configurou nada', async () => {
    const res = await request(app).get('/v1/promo-banner');
    expect(res.status).toBe(200);
    expect(res.body.title).toBeDefined();
    expect(res.body.eyebrow).toBeDefined();
  });

  it('admin atualiza o banner e o público passa a ver o novo conteúdo', async () => {
    const adminToken = await makeUser(`admin-banner-${Date.now()}@teste.com`, 'admin');

    const update = await request(app).put('/v1/admin/promo-banner').set('Authorization', `Bearer ${adminToken}`).send({
      eyebrow: 'frete grátis',
      title: 'toda semana',
      subtitle: 'em compras acima de r$250',
      description: 'Válido pra todo o Brasil, sem pegadinha.',
      imageUrl: 'http://localhost:3000/uploads/banner-teste.jpg',
    });
    expect(update.status).toBe(200);
    expect(update.body.title).toBe('toda semana');

    const publicRes = await request(app).get('/v1/promo-banner');
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.eyebrow).toBe('frete grátis');
    expect(publicRes.body.title).toBe('toda semana');
    expect(publicRes.body.imageUrl).toBe('http://localhost:3000/uploads/banner-teste.jpg');
    expect(publicRes.body.isDefault).toBe(false);
  });

  it('admin ajusta o enquadramento da imagem do banner', async () => {
    const adminToken = await makeUser(`admin-banner-enquadramento-${Date.now()}@teste.com`, 'admin');

    const update = await request(app).put('/v1/admin/promo-banner').set('Authorization', `Bearer ${adminToken}`).send({ imageFocalPoint: 'top' });
    expect(update.status).toBe(200);
    expect(update.body.imageFocalPoint).toBe('top');

    const publicRes = await request(app).get('/v1/promo-banner');
    expect(publicRes.body.imageFocalPoint).toBe('top');
  });

  it('atualizar de novo edita a MESMA linha (não cria banners duplicados)', async () => {
    const adminToken = await makeUser(`admin-banner-dup-${Date.now()}@teste.com`, 'admin');

    await request(app).put('/v1/admin/promo-banner').set('Authorization', `Bearer ${adminToken}`).send({ title: 'primeira versão' });
    await request(app).put('/v1/admin/promo-banner').set('Authorization', `Bearer ${adminToken}`).send({ title: 'segunda versão' });

    const { PromoBanner } = require('../models');
    const count = await PromoBanner.count();
    expect(count).toBe(1);

    const publicRes = await request(app).get('/v1/promo-banner');
    expect(publicRes.body.title).toBe('segunda versão');
  });

  it('operador não pode editar o banner (só admin)', async () => {
    const opToken = await makeUser(`operador-banner-${Date.now()}@teste.com`, 'operator');
    const res = await request(app).put('/v1/admin/promo-banner').set('Authorization', `Bearer ${opToken}`).send({ title: 'tentativa' });
    expect(res.status).toBe(403);
  });

  it('operador consegue LER o banner no painel (GET /admin/promo-banner)', async () => {
    const opToken = await makeUser(`operador-banner-leitura-${Date.now()}@teste.com`, 'operator');
    const res = await request(app).get('/v1/admin/promo-banner').set('Authorization', `Bearer ${opToken}`);
    expect(res.status).toBe(200);
  });

  it('visitante sem login não pode editar o banner', async () => {
    const res = await request(app).put('/v1/admin/promo-banner').send({ title: 'hack' });
    expect(res.status).toBe(401);
  });
});
