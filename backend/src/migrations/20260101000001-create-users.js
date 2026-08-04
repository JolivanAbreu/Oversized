'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING(150), allowNull: false },
      email: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      cpf: { type: Sequelize.STRING(14), unique: true },
      phone: { type: Sequelize.STRING(20) },
      role: { type: Sequelize.ENUM('customer', 'operator', 'admin'), allowNull: false, defaultValue: 'customer' },
      email_verified_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
  },
};
