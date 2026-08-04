'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('coupons', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      code: { type: Sequelize.STRING(30), allowNull: false, unique: true },
      discount_type: { type: Sequelize.ENUM('percentage', 'fixed'), allowNull: false },
      discount_value: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      min_order_value: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      valid_from: { type: Sequelize.DATE, allowNull: false },
      valid_until: { type: Sequelize.DATE, allowNull: false },
      usage_limit: { type: Sequelize.INTEGER },
      used_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('coupons');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_coupons_discount_type";');
  },
};
