const router = require('express').Router();
const controller = require('../controllers/admin.controller');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const { upload } = require('../middlewares/upload');

// Aplica autenticação + verificação de perfil em cada rota individualmente
// (nunca via router.use sem prefixo — ver nota em routes/index.js).

// Produtos e estoque — leitura liberada para admin e operador (operador
// precisa listar/ver produtos para ajustar estoque); escrita restrita a admin
router.get('/admin/products', authenticate, requireRole('admin', 'operator'), controller.listProducts);
router.get('/admin/products/:id', authenticate, requireRole('admin', 'operator'), controller.getProduct);
router.post('/admin/products', authenticate, requireRole('admin'), controller.createProduct);
router.put('/admin/products/:id', authenticate, requireRole('admin'), controller.updateProduct);
router.delete('/admin/products/:id', authenticate, requireRole('admin'), controller.deactivateProduct);
router.put('/admin/products/:id/reactivate', authenticate, requireRole('admin'), controller.reactivateProduct);
router.put('/admin/variants/:variantId/stock', authenticate, requireRole('admin', 'operator'), controller.adjustStock);

// Upload de imagem de produto — aceita arquivo do computador (multipart),
// mantendo a opção de colar uma URL já hospedada (campo separado no form)
router.post('/admin/uploads', authenticate, requireRole('admin'), upload.single('image'), controller.uploadImage);

// Pedidos — administrador e operador
router.get('/admin/orders', authenticate, requireRole('admin', 'operator'), controller.listOrders);
router.get('/admin/orders/:id', authenticate, requireRole('admin', 'operator'), controller.getOrder);
router.put('/admin/orders/:id/status', authenticate, requireRole('admin', 'operator'), controller.updateOrderStatus);

// Cupons — administrador
router.post('/admin/coupons', authenticate, requireRole('admin'), controller.createCoupon);
router.get('/admin/coupons', authenticate, requireRole('admin'), controller.listCoupons);
router.put('/admin/coupons/:id/active', authenticate, requireRole('admin'), controller.setCouponActive);

// Dashboard — restrito a administrador (dados financeiros, RNF-07)
router.get('/admin/dashboard/metrics', authenticate, requireRole('admin'), controller.dashboardMetrics);

module.exports = router;
