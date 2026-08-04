const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const cartService = require('../services/cart.service');

const getCart = asyncHandler(async (req, res) => {
  res.json(await cartService.getCartWithItems(req.user.id));
});

const addItem = asyncHandler(async (req, res) => {
  const { variant_id: variantId, quantity } = req.body;
  if (!variantId || !quantity) throw ApiError.badRequest('variant_id e quantity são obrigatórios');
  const item = await cartService.addItem(req.user.id, { variantId, quantity: Number(quantity) });
  res.status(201).json(item);
});

const updateItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (!quantity) throw ApiError.badRequest('quantity é obrigatório');
  const item = await cartService.updateItemQuantity(req.user.id, req.params.id, Number(quantity));
  res.json(item);
});

const removeItem = asyncHandler(async (req, res) => {
  await cartService.removeItem(req.user.id, req.params.id);
  res.status(204).send();
});

const shippingQuote = asyncHandler(async (req, res) => {
  const { zip } = req.body;
  if (!zip) throw ApiError.badRequest('zip é obrigatório');
  res.json(await cartService.getShippingQuote(req.user.id, zip));
});

module.exports = { getCart, addItem, updateItem, removeItem, shippingQuote };
