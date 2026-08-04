const rateLimit = require('express-rate-limit');

// Em ambiente de teste, não aplicamos limite — os testes de integração fazem
// múltiplos registros/logins em sequência rápida e não devem ser throttled.
const isTest = process.env.NODE_ENV === 'test';

// Login/registro: mitiga força bruta de credenciais (RNF-09)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isTest ? 100000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests', message: 'Muitas tentativas. Tente novamente em alguns minutos.' },
});

// Checkout/pagamento: limite mais permissivo, mas ainda protege contra abuso automatizado
const checkoutLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: isTest ? 100000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests', message: 'Muitas tentativas de checkout. Tente novamente em instantes.' },
});

module.exports = { authLimiter, checkoutLimiter };
