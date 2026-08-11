const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const productService = require('../services/product.service');
const orderService = require('../services/order.service');
const couponService = require('../services/coupon.service');
const stockService = require('../services/stock.service');
const reportService = require('../services/report.service');
const adminUserService = require('../services/adminUser.service');
const categoryService = require('../services/category.service');
const { sequelize } = require('../models');

// --- Usuários ---

const listUsers = asyncHandler(async (req, res) => {
  const { search, role, page } = req.query;
  res.json(await adminUserService.listUsers({ search, role, page }));
});

const setUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!role) throw ApiError.badRequest('role é obrigatório');
  const user = await adminUserService.setUserRole(req.params.id, role, req.user.id);
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

const resetUserPassword = asyncHandler(async (req, res) => {
  const result = await adminUserService.resetUserPassword(req.params.id);
  res.json(result);
});

// --- Produtos ---

const listProducts = asyncHandler(async (req, res) => {
  const { search, page } = req.query;
  res.json(await productService.listProductsForAdmin({ search, page }));
});

const getProduct = asyncHandler(async (req, res) => {
  res.json(await productService.getProductForAdmin(req.params.id));
});

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

const reactivateProduct = asyncHandler(async (req, res) => {
  res.json(await productService.reactivateProduct(req.params.id));
});

const adjustStock = asyncHandler(async (req, res) => {
  const { delta, reason } = req.body;
  if (delta === undefined || !reason) throw ApiError.badRequest('delta e reason são obrigatórios');
  const variant = await stockService.adjustStock(req.params.variantId, Number(delta), reason);
  res.json(variant);
});

// --- Pedidos ---

const listOrders = asyncHandler(async (req, res) => {
  const { status, search, page } = req.query;
  res.json(await orderService.listAllOrders({ status, search, page }));
});

const getOrder = asyncHandler(async (req, res) => {
  res.json(await orderService.getOrderById(null, req.params.id));
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, trackingCode } = req.body;
  if (!status) throw ApiError.badRequest('status é obrigatório');
  res.json(await orderService.updateOrderStatus(req.params.id, status, {
    trackingCode,
    transitions: orderService.ADMIN_VALID_TRANSITIONS,
  }));
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

const updateCoupon = asyncHandler(async (req, res) => {
  res.json(await couponService.updateCoupon(req.params.id, req.body));
});

const deleteCoupon = asyncHandler(async (req, res) => {
  await couponService.deleteCoupon(req.params.id);
  res.status(204).send();
});

// --- Categorias ---

const listCategories = asyncHandler(async (req, res) => {
  res.json(await categoryService.listCategoriesWithProductCount());
});

const createCategory = asyncHandler(async (req, res) => {
  res.status(201).json(await categoryService.createCategory(req.body));
});

const updateCategory = asyncHandler(async (req, res) => {
  res.json(await categoryService.updateCategory(req.params.id, req.body));
});

const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  res.status(204).send();
});

// --- Dashboard ---

// --- Upload de imagens ---

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Nenhum arquivo enviado', 'no_file');

  // Monta a URL pública a partir da própria requisição — funciona tanto em
  // desenvolvimento (localhost) quanto em produção, sem depender de
  // API_PUBLIC_URL estar configurada corretamente.
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const url = `${baseUrl}/uploads/${req.file.filename}`;
  res.status(201).json({ url });
});

// --- Relatórios ---

const salesReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  res.json(await reportService.getSalesReport({ from, to }));
});

const salesReportExport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const rows = await reportService.getSalesExportRows({ from, to });
  const csv = reportService.rowsToCsv(rows);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="relatorio-vendas-${Date.now()}.csv"`);
  res.send(csv);
});

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
  listUsers, setUserRole, resetUserPassword,
  listProducts, getProduct, createProduct, updateProduct, deactivateProduct, reactivateProduct, adjustStock,
  uploadImage,
  listOrders, getOrder, updateOrderStatus,
  createCoupon, listCoupons, setCouponActive, updateCoupon, deleteCoupon,
  listCategories, createCategory, updateCategory, deleteCategory,
  salesReport, salesReportExport,
  dashboardMetrics,
};
