'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('product_variants', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      product_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'products', key: 'id' }, onDelete: 'CASCADE',
      },
      size: { type: Sequelize.ENUM('P', 'M', 'G', 'GG', 'XG'), allowNull: false },
      color: { type: Sequelize.STRING(50), allowNull: false },
      sku: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      stock_quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      price_override: { type: Sequelize.DECIMAL(10, 2) },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('product_variants', ['product_id']);
    await queryInterface.addConstraint('product_variants', {
      fields: ['stock_quantity'],
      type: 'check',
      name: 'chk_product_variants_stock_non_negative',
      where: { stock_quantity: { [require('sequelize').Op.gte]: 0 } },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('product_variants');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_product_variants_size";');
  },
};
