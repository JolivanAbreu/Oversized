const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const productService = require('../services/product.service');
const orderService = require('../services/order.service');
const couponService = require('../services/coupon.service');
const stockService = require('../services/stock.service');
const { sequelize } = require('../models');

// --- Produtos ---

const createProduct = asyncHandler(async (req, res) => {
  const { categoryId, name, slug, basePrice } = req.body;
  if (!categoryId || !name || !slug || !basePrice) {
    throw ApiError.badRequest('Campos obrigatórios: categoryId, name, slug, basePrice');
  }
  const product = await productService.createProduct(req.body);
  res.status(201).json(product);
});

const updateProduct = asyncHandler(async (req, res) => {
  res.json(await productService.updateProduct(req.params.id, req.body));
});

const deactivateProduct = asyncHandler(async (req, res) => {
  await productService.deactivateProduct(req.params.id);
  res.status(204).send();
});

const adjustStock = asyncHandler(async (req, res) => {
  const { delta, reason } = req.body;
  if (delta === undefined || !reason) throw ApiError.badRequest('delta e reason são obrigatórios');
  const variant = await stockService.adjustStock(req.params.variantId, Number(delta), reason);
  res.json(variant);
});

// --- Pedidos ---

const listOrders = asyncHandler(async (req, res) => {
  const { status, page } = req.query;
  res.json(await orderService.listAllOrders({ status, page }));
});

const getOrder = asyncHandler(async (req, res) => {
  res.json(await orderService.getOrderById(null, req.params.id));
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, trackingCode } = req.body;
  if (!status) throw ApiError.badRequest('status é obrigatório');
  res.json(await orderService.updateOrderStatus(req.params.id, status, { trackingCode }));
});

// --- Cupons ---

const createCoupon = asyncHandler(async (req, res) => {
  const { code, discountType, discountValue, validFrom, validUntil } = req.body;
  if (!code || !discountType || !discountValue || !validFrom || !validUntil) {
    throw ApiError.badRequest('Campos obrigatórios: code, discountType, discountValue, validFrom, validUntil');
  }
  res.status(201).json(await couponService.createCoupon(req.body));
});

const listCoupons = asyncHandler(async (req, res) => {
  res.json(await couponService.listCoupons());
});

const setCouponActive = asyncHandler(async (req, res) => {
  const { active } = req.body;
  res.json(await couponService.setCouponActive(req.params.id, !!active));
});

// --- Dashboard ---

const dashboardMetrics = asyncHandler(async (req, res) => {
  const [salesByDay] = await sequelize.query(`
    SELECT DATE(created_at) AS day, COUNT(*) AS orders, SUM(total) AS revenue
    FROM orders
    WHERE status NOT IN ('cancelado') AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY day ASC;
  `);

  const [bestSelling] = await sequelize.query(`
    SELECT p.name, SUM(oi.quantity) AS units_sold
    FROM order_items oi
    JOIN product_variants pv ON pv.id = oi.variant_id
    JOIN products p ON p.id = pv.product_id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status NOT IN ('cancelado')
    GROUP BY p.name
    ORDER BY units_sold DESC
    LIMIT 10;
  `);

  const [[ticket]] = await sequelize.query(`
    SELECT AVG(total) AS average_ticket
    FROM orders WHERE status NOT IN ('cancelado', 'aguardando_pagamento');
  `);

  const [[pending]] = await sequelize.query(`
    SELECT COUNT(*) AS pending_orders FROM orders WHERE status = 'pago';
  `);

  res.json({
    sales_by_day: salesByDay,
    best_selling_products: bestSelling,
    average_ticket: Number(ticket.average_ticket || 0),
    pending_orders: Number(pending.pending_orders || 0),
  });
});

module.exports = {
  createProduct, updateProduct, deactivateProduct, adjustStock,
  listOrders, getOrder, updateOrderStatus,
  createCoupon, listCoupons, setCouponActive,
  dashboardMetrics,
};
