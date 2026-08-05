const router = require('express').Router();

router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Nota: cada sub-router aplica authenticate/requireRole por rota individual,
// nunca via router.use(authenticate) sem prefixo — como os sub-routers abaixo
// são montados em '/', um router.use() sem path intercepta TODA requisição
// que passa por ele, mesmo as destinadas a outro router mais à frente na pilha
// (isso já causou um bug real: /health e /products ficavam bloqueados por
// exigir token, pois cart.routes rodava antes na cadeia). Ver histórico do
// projeto / testes de integração para o caso que expôs o problema.
router.use(require('./auth.routes'));
router.use(require('./account.routes'));
router.use(require('./product.routes'));
router.use(require('./cart.routes'));
router.use(require('./order.routes'));
router.use(require('./payment.routes'));
router.use(require('./address.routes'));
router.use(require('./wishlist.routes'));
router.use(require('./admin.routes'));

module.exports = router;
