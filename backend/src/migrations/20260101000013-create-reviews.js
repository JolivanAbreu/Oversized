'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('reviews', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      product_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'products', key: 'id' }, onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE',
      },
      rating: { type: Sequelize.SMALLINT, allowNull: false },
      comment: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('reviews', ['product_id', 'user_id'], { unique: true });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('reviews');
  },
};
