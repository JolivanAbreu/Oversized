const ApiError = require('../utils/apiError');

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Rota ${req.method} ${req.originalUrl} não existe`));
}

// Traduz o nome da coluna violada em uma mensagem que a pessoa entende, em
// vez do "Dados inválidos" genérico que aparecia antes para qualquer conflito
// de unicidade (ex.: CPF repetido em um novo cadastro).
const UNIQUE_FIELD_MESSAGES = {
  email: 'Este e-mail já está cadastrado',
  cpf: 'Este CPF já está cadastrado',
  sku: 'Já existe uma variação com este SKU',
  code: 'Já existe um cupom com este código',
  slug: 'Já existe um produto com esse identificador (slug)',
};

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    // `details` só é preenchido por erros explicitamente marcados como
    // seguros para debug (ex.: aviso de credencial de sandbox ausente) — e
    // mesmo assim, quem gera o erro já decide não incluir isso em produção.
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      ...(err.details ? err.details : {}),
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors?.[0]?.path;
    return res.status(409).json({
      error: 'already_exists',
      message: UNIQUE_FIELD_MESSAGES[field] || 'Este valor já está em uso por outro registro',
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'validation_error',
      message: err.errors?.[0]?.message || 'Dados inválidos',
    });
  }

  if (err.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Arquivo muito grande — o limite é 5MB'
      : 'Não foi possível processar o arquivo enviado';
    return res.status(400).json({ error: 'upload_error', message });
  }

  // eslint-disable-next-line no-console
  console.error('[erro não tratado]', err);
  return res.status(500).json({ error: 'internal_error', message: 'Erro interno do servidor' });
}

module.exports = { notFoundHandler, errorHandler };
