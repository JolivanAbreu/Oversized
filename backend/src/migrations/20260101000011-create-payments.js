'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      order_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'orders', key: 'id' }, onDelete: 'CASCADE',
      },
      method: { type: Sequelize.ENUM('card', 'pix'), allowNull: false },
      provider_payment_id: { type: Sequelize.STRING(60), unique: true },
      status: { type: Sequelize.ENUM('pending', 'approved', 'rejected', 'refunded'), allowNull: false, defaultValue: 'pending' },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      installments: { type: Sequelize.INTEGER },
      pix_qr_code: { type: Sequelize.TEXT },
      pix_copy_paste: { type: Sequelize.TEXT },
      pix_expiration: { type: Sequelize.DATE },
      paid_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('payments', ['order_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('payments');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payments_method";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_payments_status";');
  },
};
