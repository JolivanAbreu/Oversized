const router = require('express').Router();
const controller = require('../controllers/account.controller');
const { authenticate } = require('../middlewares/auth');

router.get('/account', authenticate, controller.getMe);
router.put('/account', authenticate, controller.updateMe);
router.put('/account/password', authenticate, controller.changePassword);

module.exports = router;
