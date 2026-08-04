const router = require('express').Router();
const controller = require('../controllers/address.controller');
const { authenticate } = require('../middlewares/auth');

router.get('/addresses', authenticate, controller.list);
router.post('/addresses', authenticate, controller.create);
router.put('/addresses/:id', authenticate, controller.update);
router.delete('/addresses/:id', authenticate, controller.remove);

module.exports = router;
