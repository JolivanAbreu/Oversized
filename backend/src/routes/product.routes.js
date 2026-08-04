const router = require('express').Router();
const controller = require('../controllers/product.controller');
const { authenticate } = require('../middlewares/auth');

router.get('/products', controller.list);
router.get('/products/search', controller.search);
router.get('/products/:slug', controller.getBySlug);
router.get('/categories', controller.listCategories);

router.get('/products/:id/reviews', controller.listReviews);
router.post('/products/:id/reviews', authenticate, controller.createReview);

module.exports = router;
