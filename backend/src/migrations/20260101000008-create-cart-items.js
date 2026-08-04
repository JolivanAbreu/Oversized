'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cart_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      cart_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'carts', key: 'id' }, onDelete: 'CASCADE',
      },
      variant_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'product_variants', key: 'id' }, onDelete: 'CASCADE',
      },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('cart_items', ['cart_id', 'variant_id'], { unique: true });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('cart_items');
  },
};
