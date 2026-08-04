// Evita repetir try/catch em cada controller: encaminha rejeições de Promise para o errorHandler.
module.exports = function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};
