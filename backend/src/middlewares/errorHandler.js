const ApiError = require('../utils/apiError');

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Rota ${req.method} ${req.originalUrl} não existe`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.code, message: err.message });
  }

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: 'validation_error',
      message: err.errors?.[0]?.message || 'Dados inválidos',
    });
  }

  // eslint-disable-next-line no-console
  console.error('[erro não tratado]', err);
  return res.status(500).json({ error: 'internal_error', message: 'Erro interno do servidor' });
}

module.exports = { notFoundHandler, errorHandler };
