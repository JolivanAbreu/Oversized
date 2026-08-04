const router = require('express').Router();
const controller = require('../controllers/wishlist.controller');
const { authenticate } = require('../middlewares/auth');

router.get('/wishlist', authenticate, controller.list);
router.post('/wishlist', authenticate, controller.add);
router.delete('/wishlist/:productId', authenticate, controller.remove);

module.exports = router;
