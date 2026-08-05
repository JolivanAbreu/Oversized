const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const orderService = require('../services/order.service');

const create = asyncHandler(async (req, res) => {
  const { address_id: addressId, shipping_option_id: shippingOptionId, coupon_code: couponCode } = req.body;
  if (!addressId || !shippingOptionId) {
    throw ApiError.badRequest('address_id e shipping_option_id são obrigatórios');
  }

  const order = await orderService.createOrder(req.user.id, { addressId, shippingOptionId, couponCode });
  res.status(201).json(order);
});

const listMine = asyncHandler(async (req, res) => {
  res.json(await orderService.listOrdersForUser(req.user.id));
});

const getOne = asyncHandler(async (req, res) => {
  res.json(await orderService.getOrderById(req.user.id, req.params.id));
});

const cancel = asyncHandler(async (req, res) => {
  res.json(await orderService.cancelOwnOrder(req.user.id, req.params.id));
});

const remove = asyncHandler(async (req, res) => {
  await orderService.deleteOwnOrder(req.user.id, req.params.id);
  res.status(204).send();
});

module.exports = { create, listMine, getOne, cancel, remove };
