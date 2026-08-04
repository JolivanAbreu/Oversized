const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { Address, sequelize } = require('../models');

const list = asyncHandler(async (req, res) => {
  const addresses = await Address.findAll({ where: { userId: req.user.id }, order: [['isDefault', 'DESC'], ['createdAt', 'DESC']] });
  res.json(addresses);
});

const create = asyncHandler(async (req, res) => {
  const { label, street, number, complement, neighborhood, city, state, zip, isDefault } = req.body;
  if (!street || !number || !neighborhood || !city || !state || !zip) {
    throw ApiError.badRequest('Campos obrigatórios: street, number, neighborhood, city, state, zip');
  }

  const address = await sequelize.transaction(async (transaction) => {
    if (isDefault) {
      await Address.update({ isDefault: false }, { where: { userId: req.user.id }, transaction });
    }
    return Address.create(
      { userId: req.user.id, label, street, number, complement, neighborhood, city, state, zip, isDefault: !!isDefault },
      { transaction }
    );
  });

  res.status(201).json(address);
});

const update = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!address) throw ApiError.notFound('Endereço não encontrado');

  if (req.body.isDefault) {
    await Address.update({ isDefault: false }, { where: { userId: req.user.id } });
  }
  await address.update(req.body);
  res.json(address);
});

const remove = asyncHandler(async (req, res) => {
  const deleted = await Address.destroy({ where: { id: req.params.id, userId: req.user.id } });
  if (!deleted) throw ApiError.notFound('Endereço não encontrado');
  res.status(204).send();
});

module.exports = { list, create, update, remove };
