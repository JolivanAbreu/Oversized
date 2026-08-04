const router = require('express').Router();
const controller = require('../controllers/payment.controller');
const { authenticate } = require('../middlewares/auth');
const { checkoutLimiter } = require('../middlewares/rateLimit');

// Webhook: sem autenticação JWT — validado por assinatura HMAC dentro do controller/service (RNF-08)
router.post('/webhooks/mercadopago', controller.webhook);

router.post('/payments/card', authenticate, checkoutLimiter, controller.payWithCard);
router.post('/payments/pix', authenticate, checkoutLimiter, controller.payWithPix);
router.get('/payments/:id/status', authenticate, controller.status);

module.exports = router;
