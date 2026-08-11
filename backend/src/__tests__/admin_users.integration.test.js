const request = require('supertest');

const app = require('../app');
const { sequelize, User } = require('../models');

async function makeUser(email, role) {
  await request(app).post('/v1/register').send({
    name: 'Usuário Gestão', email, password: 'senha1234', cpf: `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 11), phone: '85999999999',
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

describe('Gestão de usuários (painel administrativo)', () => {
  it('admin lista usuários e consegue buscar por nome/e-mail', async () => {
    const email = `busca-usuario-${Date.now()}@teste.com`;
    await makeUser(email);
    const adminToken = await makeUser(`admin-lista-${Date.now()}@teste.com`, 'admin');

    const res = await request(app).get('/v1/admin/users').set('Authorization', `Bearer ${adminToken}`).query({ search: email });
    expect(res.status).toBe(200);
    expect(res.body.data.some((u) => u.email === email)).toBe(true);
  });

  it('operador não pode listar usuários (403)', async () => {
    const opToken = await makeUser(`op-lista-${Date.now()}@teste.com`, 'operator');
    const res = await request(app).get('/v1/admin/users').set('Authorization', `Bearer ${opToken}`);
    expect(res.status).toBe(403);
  });

  it('admin promove um cliente a operador', async () => {
    const clientEmail = `promover-${Date.now()}@teste.com`;
    await makeUser(clientEmail);
    const adminToken = await makeUser(`admin-promove-${Date.now()}@teste.com`, 'admin');

    const target = await User.findOne({ where: { email: clientEmail } });
    const res = await request(app).put(`/v1/admin/users/${target.id}/role`).set('Authorization', `Bearer ${adminToken}`).send({ role: 'operator' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('operator');
  });

  it('rejeita perfil inválido', async () => {
    const clientEmail = `perfil-invalido-${Date.now()}@teste.com`;
    await makeUser(clientEmail);
    const adminToken = await makeUser(`admin-invalido-${Date.now()}@teste.com`, 'admin');
    const target = await User.findOne({ where: { email: clientEmail } });

    const res = await request(app).put(`/v1/admin/users/${target.id}/role`).set('Authorization', `Bearer ${adminToken}`).send({ role: 'super-admin' });
    expect(res.status).toBe(400);
  });

  it('admin não pode alterar o próprio perfil por essa rota', async () => {
    const adminEmail = `admin-self-${Date.now()}@teste.com`;
    const adminToken = await makeUser(adminEmail, 'admin');
    const self = await User.findOne({ where: { email: adminEmail } });

    const res = await request(app).put(`/v1/admin/users/${self.id}/role`).set('Authorization', `Bearer ${adminToken}`).send({ role: 'operator' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('cannot_change_own_role');
  });

  it('admin gera senha temporária para um cliente, e o cliente consegue logar com ela', async () => {
    const clientEmail = `reset-senha-${Date.now()}@teste.com`;
    await makeUser(clientEmail);
    const adminToken = await makeUser(`admin-reset-${Date.now()}@teste.com`, 'admin');
    const target = await User.findOne({ where: { email: clientEmail } });

    const res = await request(app).post(`/v1/admin/users/${target.id}/reset-password`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.temporaryPassword).toBeDefined();
    expect(res.body.temporaryPassword.length).toBeGreaterThanOrEqual(6);

    const loginOld = await request(app).post('/v1/login').send({ email: clientEmail, password: 'senha1234' });
    expect(loginOld.status).toBe(401);

    const loginNew = await request(app).post('/v1/login').send({ email: clientEmail, password: res.body.temporaryPassword });
    expect(loginNew.status).toBe(200);
  });
});
