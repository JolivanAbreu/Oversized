const router = require('express').Router();
const controller = require('../controllers/order.controller');
const { authenticate } = require('../middlewares/auth');
const { checkoutLimiter } = require('../middlewares/rateLimit');

router.post('/orders', authenticate, checkoutLimiter, controller.create);
router.get('/orders', authenticate, controller.listMine);
router.get('/orders/:id', authenticate, controller.getOne);
router.post('/orders/:id/cancel', authenticate, controller.cancel);
router.delete('/orders/:id', authenticate, controller.remove);

module.exports = router;
