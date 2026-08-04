'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('order_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      order_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'orders', key: 'id' }, onDelete: 'CASCADE',
      },
      variant_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'product_variants', key: 'id' }, onDelete: 'RESTRICT',
      },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      unit_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('order_items', ['order_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('order_items');
  },
};
