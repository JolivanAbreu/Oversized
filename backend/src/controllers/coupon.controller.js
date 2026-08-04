const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const cartService = require('../services/cart.service');
const couponService = require('../services/coupon.service');

const validate = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) throw ApiError.badRequest('code é obrigatório');

  const cart = await cartService.getCartWithItems(req.user.id);
  const coupon = await couponService.validateCoupon(code, cart.subtotal);
  const discount = couponService.calculateDiscount(coupon, cart.subtotal);

  res.json({ code: coupon.code, discount: Number(discount.toFixed(2)), new_subtotal: Number((cart.subtotal - discount).toFixed(2)) });
});

module.exports = { validate };
