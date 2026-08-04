'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('addresses', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE',
      },
      label: { type: Sequelize.STRING(50) },
      street: { type: Sequelize.STRING(200), allowNull: false },
      number: { type: Sequelize.STRING(20), allowNull: false },
      complement: { type: Sequelize.STRING(100) },
      neighborhood: { type: Sequelize.STRING(100), allowNull: false },
      city: { type: Sequelize.STRING(100), allowNull: false },
      state: { type: Sequelize.STRING(2), allowNull: false },
      zip: { type: Sequelize.STRING(9), allowNull: false },
      is_default: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('addresses', ['user_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('addresses');
  },
};
