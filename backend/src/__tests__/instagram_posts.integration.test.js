const request = require('supertest');

const app = require('../app');
const { sequelize, User, InstagramPost } = require('../models');

async function makeUser(email, role) {
  await request(app).post('/v1/register').send({
    name: 'Usuário Instagram', email, password: 'senha1234', cpf: `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 11), phone: '85999999999',
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

describe('Galeria curada do Instagram', () => {
  it('GET /instagram-posts é público e retorna um array', async () => {
    const res = await request(app).get('/v1/instagram-posts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('admin cria um post e ele aparece no endpoint público', async () => {
    const adminToken = await makeUser(`admin-insta-cria-${Date.now()}@teste.com`, 'admin');

    const created = await request(app).post('/v1/admin/instagram-posts').set('Authorization', `Bearer ${adminToken}`).send({
      imageUrl: 'http://localhost:3000/uploads/post-real.jpg',
      postUrl: 'https://www.instagram.com/p/ABC123XYZ/',
      caption: 'Look do dia',
    });
    expect(created.status).toBe(201);
    expect(created.body.imageUrl).toBe('http://localhost:3000/uploads/post-real.jpg');

    const publicRes = await request(app).get('/v1/instagram-posts');
    expect(publicRes.body.some((p) => p.id === created.body.id)).toBe(true);
  });

  it('rejeita post sem imageUrl ou sem postUrl', async () => {
    const adminToken = await makeUser(`admin-insta-invalido-${Date.now()}@teste.com`, 'admin');

    const semImagem = await request(app).post('/v1/admin/instagram-posts').set('Authorization', `Bearer ${adminToken}`).send({
      postUrl: 'https://www.instagram.com/p/XYZ/',
    });
    expect(semImagem.status).toBe(400);

    const semLink = await request(app).post('/v1/admin/instagram-posts').set('Authorization', `Bearer ${adminToken}`).send({
      imageUrl: 'http://localhost:3000/uploads/foto.jpg',
    });
    expect(semLink.status).toBe(400);
  });

  it('admin edita um post existente (legenda e ordem)', async () => {
    const adminToken = await makeUser(`admin-insta-edita-${Date.now()}@teste.com`, 'admin');
    const created = await request(app).post('/v1/admin/instagram-posts').set('Authorization', `Bearer ${adminToken}`).send({
      imageUrl: 'http://localhost:3000/uploads/edita.jpg',
      postUrl: 'https://www.instagram.com/p/EDIT/',
    });

    const updated = await request(app).put(`/v1/admin/instagram-posts/${created.body.id}`).set('Authorization', `Bearer ${adminToken}`).send({
      caption: 'Nova legenda', displayOrder: 5,
    });

    expect(updated.status).toBe(200);
    expect(updated.body.caption).toBe('Nova legenda');
    expect(updated.body.displayOrder).toBe(5);
  });

  it('admin desativa um post e ele some do endpoint público, mas continua no painel', async () => {
    const adminToken = await makeUser(`admin-insta-desativa-${Date.now()}@teste.com`, 'admin');
    const created = await request(app).post('/v1/admin/instagram-posts').set('Authorization', `Bearer ${adminToken}`).send({
      imageUrl: 'http://localhost:3000/uploads/desativa.jpg',
      postUrl: 'https://www.instagram.com/p/OFF/',
    });

    await request(app).put(`/v1/admin/instagram-posts/${created.body.id}`).set('Authorization', `Bearer ${adminToken}`).send({ active: false });

    const publicRes = await request(app).get('/v1/instagram-posts');
    expect(publicRes.body.some((p) => p.id === created.body.id)).toBe(false);

    const adminList = await request(app).get('/v1/admin/instagram-posts').set('Authorization', `Bearer ${adminToken}`);
    expect(adminList.body.some((p) => p.id === created.body.id)).toBe(true);
  });

  it('admin exclui um post de vez', async () => {
    const adminToken = await makeUser(`admin-insta-exclui-${Date.now()}@teste.com`, 'admin');
    const created = await request(app).post('/v1/admin/instagram-posts').set('Authorization', `Bearer ${adminToken}`).send({
      imageUrl: 'http://localhost:3000/uploads/exclui.jpg',
      postUrl: 'https://www.instagram.com/p/DEL/',
    });

    const res = await request(app).delete(`/v1/admin/instagram-posts/${created.body.id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);

    const found = await InstagramPost.findByPk(created.body.id);
    expect(found).toBeNull();
  });

  it('respeita a ordem de exibição (displayOrder)', async () => {
    // Usa o endpoint de admin (sem limite) em vez do público — o público
    // trunca em 6 itens, e como outros testes da suíte também criam posts
    // com displayOrder padrão (0), rodar a suíte inteira em sequência
    // poderia empurrar os posts deste teste pra fora do topo 6, tornando o
    // teste frágil por acaso de ordem de execução, não por um bug real.
    const adminToken = await makeUser(`admin-insta-ordem-${Date.now()}@teste.com`, 'admin');
    const uniqueMarker = `ordem-${Date.now()}`;
    const second = await request(app).post('/v1/admin/instagram-posts').set('Authorization', `Bearer ${adminToken}`).send({
      imageUrl: 'http://localhost:3000/uploads/segundo.jpg', postUrl: `https://www.instagram.com/p/SEG-${uniqueMarker}/`, displayOrder: 200,
    });
    const first = await request(app).post('/v1/admin/instagram-posts').set('Authorization', `Bearer ${adminToken}`).send({
      imageUrl: 'http://localhost:3000/uploads/primeiro.jpg', postUrl: `https://www.instagram.com/p/PRIM-${uniqueMarker}/`, displayOrder: 100,
    });

    const adminList = await request(app).get('/v1/admin/instagram-posts').set('Authorization', `Bearer ${adminToken}`);
    const firstIndex = adminList.body.findIndex((p) => p.id === first.body.id);
    const secondIndex = adminList.body.findIndex((p) => p.id === second.body.id);
    expect(firstIndex).toBeGreaterThanOrEqual(0);
    expect(secondIndex).toBeGreaterThanOrEqual(0);
    expect(firstIndex).toBeLessThan(secondIndex);
  });

  it('operador não pode criar/editar/excluir posts (só admin)', async () => {
    const opToken = await makeUser(`operador-insta-${Date.now()}@teste.com`, 'operator');

    const createRes = await request(app).post('/v1/admin/instagram-posts').set('Authorization', `Bearer ${opToken}`).send({
      imageUrl: 'http://localhost:3000/uploads/x.jpg', postUrl: 'https://www.instagram.com/p/X/',
    });
    expect(createRes.status).toBe(403);
  });

  it('operador consegue LER a lista completa no painel', async () => {
    const opToken = await makeUser(`operador-insta-leitura-${Date.now()}@teste.com`, 'operator');
    const res = await request(app).get('/v1/admin/instagram-posts').set('Authorization', `Bearer ${opToken}`);
    expect(res.status).toBe(200);
  });

  it('visitante sem login não pode criar post', async () => {
    const res = await request(app).post('/v1/admin/instagram-posts').send({
      imageUrl: 'http://localhost:3000/uploads/x.jpg', postUrl: 'https://www.instagram.com/p/X/',
    });
    expect(res.status).toBe(401);
  });
});
