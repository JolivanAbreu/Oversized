const { ProductVariant, sequelize } = require('../models');
const ApiError = require('../utils/apiError');

/**
 * Decrementa o estoque de uma variação de forma atômica: o UPDATE só afeta a
 * linha se houver saldo suficiente (WHERE stock_quantity >= quantity), o que
 * evita estoque negativo mesmo sob requisições concorrentes (RN-02) sem
 * precisar de lock explícito de linha.
 */
async function reserveStock(variantId, quantity, { transaction } = {}) {
  const [rows] = await sequelize.query(
    `UPDATE product_variants
     SET stock_quantity = stock_quantity - :quantity, updated_at = NOW()
     WHERE id = :variantId AND stock_quantity >= :quantity
     RETURNING id, sku, stock_quantity;`,
    { replacements: { variantId, quantity }, transaction }
  );

  if (rows.length === 0) {
    const variant = await ProductVariant.findByPk(variantId, { transaction });
    if (!variant) throw ApiError.notFound('Variação de produto não encontrada');
    throw ApiError.conflict(`Estoque insuficiente para o SKU ${variant.sku}`, 'insufficient_stock');
  }

  return rows[0];
}

async function releaseStock(variantId, quantity, { transaction } = {}) {
  await sequelize.query(
    `UPDATE product_variants SET stock_quantity = stock_quantity + :quantity, updated_at = NOW()
     WHERE id = :variantId;`,
    { replacements: { variantId, quantity }, transaction }
  );
}

async function adjustStock(variantId, delta, reason) {
  const variant = await ProductVariant.findByPk(variantId);
  if (!variant) throw ApiError.notFound('Variação não encontrada');

  const newQuantity = variant.stockQuantity + delta;
  if (newQuantity < 0) {
    throw ApiError.unprocessable('Ajuste resultaria em estoque negativo');
  }

  variant.stockQuantity = newQuantity;
  await variant.save();

  // eslint-disable-next-line no-console
  console.log(`[estoque] SKU ${variant.sku}: ${delta >= 0 ? '+' : ''}${delta} (motivo: ${reason}) -> ${newQuantity}`);
  return variant;
}

module.exports = { reserveStock, releaseStock, adjustStock };
