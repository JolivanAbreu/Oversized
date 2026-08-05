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

  // E-mail, CPF e perfil (role) não são editáveis por aqui: e-mail é
  // identidade de login (mudar exigiria reconfirmação), CPF é documento fixo,
  // e role é controlado apenas pelo painel administrativo.
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
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

module.exports = { getProfile, updateProfile, changePassword };
