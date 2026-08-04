const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const ApiError = require('../utils/apiError');
const emailService = require('./email.service');

// Tokens de confirmação de e-mail e redefinição de senha guardados em memória
// para simplificar este exemplo. Em produção, mover para uma tabela dedicada
// (ex.: password_reset_tokens) com expiração e índice, ou para o Redis.
const emailTokens = new Map(); // token -> userId
const resetTokens = new Map(); // token -> { userId, expiresAt }

function issueTokens(user) {
  const accessToken = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ sub: user.id, type: 'refresh' }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
  return { accessToken, refreshToken };
}

async function register({ name, email, password, cpf, phone }) {
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw ApiError.conflict('E-mail já cadastrado', 'email_already_registered');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, cpf, phone, role: 'customer' });

  const token = crypto.randomBytes(32).toString('hex');
  emailTokens.set(token, user.id);
  // Best-effort: uma falha no envio do e-mail de confirmação (SMTP fora do ar,
  // timeout etc.) não pode derrubar o cadastro, que já foi persistido com
  // sucesso. O cliente pode solicitar reenvio depois.
  emailService.sendEmailConfirmation(user, token).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[email] falha ao enviar confirmação de cadastro:', err.message);
  });

  return user;
}

async function confirmEmail(token) {
  const userId = emailTokens.get(token);
  if (!userId) throw ApiError.badRequest('Token de confirmação inválido ou expirado');
  emailTokens.delete(token);
  await User.update({ emailVerifiedAt: new Date() }, { where: { id: userId } });
}

async function login({ email, password }) {
  const user = await User.scope('withPassword').findOne({ where: { email } });
  if (!user) throw ApiError.unauthorized('Credenciais inválidas');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Credenciais inválidas');

  return { user, tokens: issueTokens(user) };
}

async function refresh(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw ApiError.unauthorized('Refresh token inválido ou expirado');
  }
  const user = await User.findByPk(payload.sub);
  if (!user) throw ApiError.unauthorized('Usuário não encontrado');
  return issueTokens(user);
}

async function forgotPassword(email) {
  const user = await User.findOne({ where: { email } });
  // Não revela se o e-mail existe ou não, para evitar enumeração de contas.
  if (!user) return;

  const token = crypto.randomBytes(32).toString('hex');
  resetTokens.set(token, { userId: user.id, expiresAt: Date.now() + 60 * 60 * 1000 });
  emailService.sendPasswordReset(user, token).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[email] falha ao enviar redefinição de senha:', err.message);
  });
}

async function resetPassword(token, newPassword) {
  const entry = resetTokens.get(token);
  if (!entry || entry.expiresAt < Date.now()) {
    throw ApiError.badRequest('Token de redefinição inválido ou expirado');
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await User.update({ passwordHash }, { where: { id: entry.userId } });
  resetTokens.delete(token);
}

module.exports = { register, confirmEmail, login, refresh, forgotPassword, resetPassword, issueTokens };
