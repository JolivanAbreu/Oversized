'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface) => {
    const categoryId = uuidv4();
    const productId = uuidv4();

    await queryInterface.bulkInsert('categories', [
      { id: categoryId, name: 'Blusas Oversized', slug: 'blusas-oversized', description: 'Blusas de caimento largo', created_at: new Date(), updated_at: new Date() },
    ]);

    await queryInterface.bulkInsert('products', [
      {
        id: productId,
        category_id: categoryId,
        name: 'Blusa Oversized Básica',
        slug: 'blusa-oversized-basica',
        description: 'Blusa oversized 100% algodão, caimento solto e confortável.',
        fabric: '100% algodão',
        care_instructions: 'Lavar à mão ou em ciclo delicado, não usar alvejante.',
        base_price: 89.9,
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('product_variants', [
      { id: uuidv4(), product_id: productId, size: 'M', color: 'Preto', sku: 'BOS-BASICA-M-PRETO', stock_quantity: 20, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productId, size: 'G', color: 'Preto', sku: 'BOS-BASICA-G-PRETO', stock_quantity: 15, created_at: new Date(), updated_at: new Date() },
      { id: uuidv4(), product_id: productId, size: 'GG', color: 'Branco', sku: 'BOS-BASICA-GG-BRANCO', stock_quantity: 10, created_at: new Date(), updated_at: new Date() },
    ]);

    await queryInterface.bulkInsert('coupons', [
      {
        id: uuidv4(), code: 'BEMVINDA10', discount_type: 'percentage', discount_value: 10, min_order_value: 50,
        valid_from: new Date(), valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        usage_limit: null, used_count: 0, active: true, created_at: new Date(), updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('coupons', null, {});
    await queryInterface.bulkDelete('product_variants', null, {});
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('categories', null, {});
  },
};
