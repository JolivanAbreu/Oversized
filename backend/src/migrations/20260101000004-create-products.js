'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('products', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      category_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'categories', key: 'id' }, onDelete: 'RESTRICT',
      },
      name: { type: Sequelize.STRING(150), allowNull: false },
      slug: { type: Sequelize.STRING(180), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT },
      fabric: { type: Sequelize.STRING(100) },
      care_instructions: { type: Sequelize.TEXT },
      base_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('products', ['category_id']);
    await queryInterface.addIndex('products', ['active']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('products');
  },
};
