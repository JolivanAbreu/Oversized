const bcrypt = require('bcryptjs');
const { User } = require('../models');
const ApiError = require('../utils/apiError');

async function getProfile(userId) {
  const user = await User.findByPk(userId);
  if (!user) throw ApiError.notFound('Usuário não encontrado');
  return user;
}

async function updateProfile(userId, { name, phone }) {
  const user = await User.findByPk(userId);
  if (!user) throw ApiError.notFound('Usuário não encontrado');

  // E-mail, CPF e perfil (role) não são editáveis por aqui: e-mail tem fluxo
  // próprio (changeEmail, abaixo, exige senha), CPF é documento fixo, e role
  // é controlado apenas pelo painel administrativo.
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  await user.save();
  return user;
}

async function changeEmail(userId, { newEmail, currentPassword }) {
  const user = await User.scope('withPassword').findByPk(userId);
  if (!user) throw ApiError.notFound('Usuário não encontrado');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Senha atual incorreta', 'invalid_current_password');

  const existing = await User.findOne({ where: { email: newEmail } });
  if (existing && existing.id !== userId) {
    throw ApiError.conflict('Este e-mail já está em uso por outra conta', 'email_already_registered');
  }

  user.email = newEmail;
  await user.save();
  return user;
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.scope('withPassword').findByPk(userId);
  if (!user) throw ApiError.notFound('Usuário não encontrado');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Senha atual incorreta', 'invalid_current_password');

  if (newPassword.length < 8) {
    throw ApiError.badRequest('A nova senha deve ter ao menos 8 caracteres');
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
}

module.exports = { getProfile, updateProfile, changeEmail, changePassword };
