const ApiError = require('../utils/apiError');

// Uso: router.get('/admin/x', authenticate, requireRole('admin'), handler)
// Uso com múltiplos perfis: requireRole('admin', 'operator')
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('Seu perfil não tem permissão para esta ação'));
    }
    next();
  };
}

module.exports = { requireRole };
