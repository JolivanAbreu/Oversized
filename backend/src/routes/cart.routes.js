const router = require('express').Router();
const cartController = require('../controllers/cart.controller');
const couponController = require('../controllers/coupon.controller');
const { authenticate } = require('../middlewares/auth');

router.get('/cart', authenticate, cartController.getCart);
router.post('/cart/items', authenticate, cartController.addItem);
router.put('/cart/items/:id', authenticate, cartController.updateItem);
router.delete('/cart/items/:id', authenticate, cartController.removeItem);
router.post('/cart/shipping-quote', authenticate, cartController.shippingQuote);

router.post('/coupons/validate', authenticate, couponController.validate);

module.exports = router;
