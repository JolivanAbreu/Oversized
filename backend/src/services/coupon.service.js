const { Op } = require('sequelize');
const { Coupon } = require('../models');
const ApiError = require('../utils/apiError');

async function validateCoupon(code, orderSubtotal) {
  const coupon = await Coupon.findOne({ where: { code: code.toUpperCase(), active: true } });
  const now = new Date();

  if (!coupon) {
    throw ApiError.unprocessable('Cupom não encontrado ou inativo', 'invalid_coupon');
  }
  if (now < coupon.validFrom || now > coupon.validUntil) {
    throw ApiError.unprocessable('Cupom fora do período de validade', 'coupon_expired');
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.unprocessable('Cupom atingiu o limite de usos', 'coupon_usage_limit_reached');
  }
  if (Number(orderSubtotal) < Number(coupon.minOrderValue)) {
    throw ApiError.unprocessable(
      `Valor mínimo para este cupom é R$ ${Number(coupon.minOrderValue).toFixed(2)}`,
      'coupon_below_minimum'
    );
  }

  return coupon;
}

function calculateDiscount(coupon, subtotal) {
  if (coupon.discountType === 'percentage') {
    return (Number(subtotal) * Number(coupon.discountValue)) / 100;
  }
  return Math.min(Number(coupon.discountValue), Number(subtotal));
}

async function registerUsage(couponCode, { transaction } = {}) {
  await Coupon.increment('usedCount', { by: 1, where: { code: couponCode }, transaction });
}

// --- Admin ---

async function createCoupon(payload) {
  return Coupon.create({ ...payload, code: payload.code.toUpperCase() });
}

async function listCoupons() {
  return Coupon.findAll({ order: [['createdAt', 'DESC']] });
}

async function setCouponActive(id, active) {
  const coupon = await Coupon.findByPk(id);
  if (!coupon) throw ApiError.notFound('Cupom não encontrado');
  coupon.active = active;
  await coupon.save();
  return coupon;
}

async function updateCoupon(id, payload) {
  const coupon = await Coupon.findByPk(id);
  if (!coupon) throw ApiError.notFound('Cupom não encontrado');

  const { code, discountType, discountValue, minOrderValue, validFrom, validUntil, usageLimit } = payload;
  if (code !== undefined) coupon.code = code.toUpperCase();
  if (discountType !== undefined) coupon.discountType = discountType;
  if (discountValue !== undefined) coupon.discountValue = discountValue;
  if (minOrderValue !== undefined) coupon.minOrderValue = minOrderValue;
  if (validFrom !== undefined) coupon.validFrom = validFrom;
  if (validUntil !== undefined) coupon.validUntil = validUntil;
  if (usageLimit !== undefined) coupon.usageLimit = usageLimit;

  await coupon.save();
  return coupon;
}

async function deleteCoupon(id) {
  // Seguro excluir de verdade: order.couponCode guarda só o texto do código
  // usado (não é uma FK para coupons.id), então remover o cupom não afeta o
  // histórico de pedidos que já o utilizaram.
  const deleted = await Coupon.destroy({ where: { id } });
  if (!deleted) throw ApiError.notFound('Cupom não encontrado');
}

module.exports = {
  validateCoupon, calculateDiscount, registerUsage,
  createCoupon, listCoupons, setCouponActive, updateCoupon, deleteCoupon,
};
