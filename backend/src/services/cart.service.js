const { Cart, CartItem, ProductVariant, Product, ProductImage } = require('../models');
const ApiError = require('../utils/apiError');
const shippingIntegration = require('../integrations/shipping');
const couponService = require('./coupon.service');

async function getOrCreateCart(userId) {
  const [cart] = await Cart.findOrCreate({ where: { userId } });
  return cart;
}

async function getCartWithItems(userId) {
  const cart = await getOrCreateCart(userId);
  const items = await CartItem.findAll({
    where: { cartId: cart.id },
    include: [{
      model: ProductVariant,
      as: 'variant',
      include: [{ model: Product, as: 'product', include: [{ model: ProductImage, as: 'images', separate: true, limit: 1 }] }],
    }],
  });
  return buildCartSummary(cart, items);
}

function unitPriceOf(variant) {
  return Number(variant.priceOverride ?? variant.product.basePrice);
}

function buildCartSummary(cart, items, couponDiscount = 0) {
  const subtotal = items.reduce((sum, item) => sum + unitPriceOf(item.variant) * item.quantity, 0);
  return {
    id: cart.id,
    items: items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      variant: item.variant,
      unitPrice: unitPriceOf(item.variant),
      lineTotal: unitPriceOf(item.variant) * item.quantity,
    })),
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(couponDiscount.toFixed(2)),
  };
}

async function addItem(userId, { variantId, quantity }) {
  if (quantity < 1) throw ApiError.badRequest('Quantidade deve ser maior que zero');

  const variant = await ProductVariant.findByPk(variantId);
  if (!variant) throw ApiError.notFound('Variação de produto não encontrada');

  const cart = await getOrCreateCart(userId);
  const existing = await CartItem.findOne({ where: { cartId: cart.id, variantId } });
  const desiredQuantity = (existing?.quantity || 0) + quantity;

  if (variant.stockQuantity < desiredQuantity) {
    throw ApiError.conflict(`Estoque insuficiente para o SKU ${variant.sku}`, 'insufficient_stock');
  }

  if (existing) {
    existing.quantity = desiredQuantity;
    await existing.save();
    return existing;
  }
  return CartItem.create({ cartId: cart.id, variantId, quantity });
}

async function updateItemQuantity(userId, itemId, quantity) {
  if (quantity < 1) throw ApiError.badRequest('Quantidade deve ser maior que zero');

  const cart = await getOrCreateCart(userId);
  const item = await CartItem.findOne({ where: { id: itemId, cartId: cart.id }, include: [{ model: ProductVariant, as: 'variant' }] });
  if (!item) throw ApiError.notFound('Item não encontrado no carrinho');

  if (item.variant.stockQuantity < quantity) {
    throw ApiError.conflict(`Estoque insuficiente para o SKU ${item.variant.sku}`, 'insufficient_stock');
  }

  item.quantity = quantity;
  await item.save();
  return item;
}

async function removeItem(userId, itemId) {
  const cart = await getOrCreateCart(userId);
  const deleted = await CartItem.destroy({ where: { id: itemId, cartId: cart.id } });
  if (!deleted) throw ApiError.notFound('Item não encontrado no carrinho');
}

async function clearCart(userId, { transaction } = {}) {
  const cart = await getOrCreateCart(userId);
  await CartItem.destroy({ where: { cartId: cart.id }, transaction });
}

async function getShippingQuote(userId, zip) {
  const { items } = await getCartWithItems(userId);
  if (items.length === 0) throw ApiError.badRequest('Carrinho vazio');
  return shippingIntegration.quoteShipping({ zip, items });
}

async function getCheckoutSummary(userId, { couponCode } = {}) {
  const summary = await getCartWithItems(userId);
  if (summary.items.length === 0) throw ApiError.badRequest('Carrinho vazio');

  let discount = 0;
  let appliedCoupon = null;
  if (couponCode) {
    appliedCoupon = await couponService.validateCoupon(couponCode, summary.subtotal);
    discount = couponService.calculateDiscount(appliedCoupon, summary.subtotal);
  }

  return { ...summary, discount: Number(discount.toFixed(2)), appliedCoupon };
}

module.exports = {
  getOrCreateCart,
  getCartWithItems,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  getShippingQuote,
  getCheckoutSummary,
  unitPriceOf,
};
