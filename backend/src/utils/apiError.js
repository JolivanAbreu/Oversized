class ApiError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, code = 'bad_request') {
    return new ApiError(400, code, message);
  }
  static unauthorized(message = 'Não autenticado', code = 'unauthorized') {
    return new ApiError(401, code, message);
  }
  static forbidden(message = 'Acesso negado', code = 'forbidden') {
    return new ApiError(403, code, message);
  }
  static notFound(message = 'Recurso não encontrado', code = 'not_found') {
    return new ApiError(404, code, message);
  }
  static conflict(message, code = 'conflict') {
    return new ApiError(409, code, message);
  }
  static unprocessable(message, code = 'unprocessable_entity') {
    return new ApiError(422, code, message);
  }
  static paymentRequired(message, code = 'payment_required') {
    return new ApiError(402, code, message);
  }
}

module.exports = ApiError;
