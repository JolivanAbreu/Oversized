const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const accountService = require('../services/account.service');

const getMe = asyncHandler(async (req, res) => {
  const user = await accountService.getProfile(req.user.id);
  res.json({ id: user.id, name: user.name, email: user.email, cpf: user.cpf, phone: user.phone, role: user.role });
});

const updateMe = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const user = await accountService.updateProfile(req.user.id, { name, phone });
  res.json({ id: user.id, name: user.name, email: user.email, cpf: user.cpf, phone: user.phone, role: user.role });
});

const changeEmail = asyncHandler(async (req, res) => {
  const { new_email: newEmail, current_password: currentPassword } = req.body;
  if (!newEmail || !currentPassword) {
    throw ApiError.badRequest('new_email e current_password são obrigatórios');
  }
  const user = await accountService.changeEmail(req.user.id, { newEmail, currentPassword });
  res.json({ id: user.id, name: user.name, email: user.email, cpf: user.cpf, phone: user.phone, role: user.role });
});

const changePassword = asyncHandler(async (req, res) => {
  const { current_password: currentPassword, new_password: newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw ApiError.badRequest('current_password e new_password são obrigatórios');
  }
  await accountService.changePassword(req.user.id, { currentPassword, newPassword });
  res.json({ message: 'Senha atualizada com sucesso' });
});

module.exports = { getMe, updateMe, changeEmail, changePassword };
