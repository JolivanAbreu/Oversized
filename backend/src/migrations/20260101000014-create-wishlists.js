'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('wishlists', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE',
      },
      product_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'products', key: 'id' }, onDelete: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('wishlists', ['user_id', 'product_id'], { unique: true });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('wishlists');
  },
};
