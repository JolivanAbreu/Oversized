'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('product_images', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      product_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'products', key: 'id' }, onDelete: 'CASCADE',
      },
      url: { type: Sequelize.STRING(500), allowNull: false },
      order: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('product_images', ['product_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('product_images');
  },
};
