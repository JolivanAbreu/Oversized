'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('orders', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT',
      },
      address_id: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'addresses', key: 'id' }, onDelete: 'RESTRICT',
      },
      order_number: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      status: {
        type: Sequelize.ENUM(
          'aguardando_pagamento', 'pago', 'em_separacao', 'enviado', 'entregue', 'cancelado', 'reembolsado'
        ),
        allowNull: false,
        defaultValue: 'aguardando_pagamento',
      },
      subtotal: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      discount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      shipping_cost: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      total: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      coupon_code: { type: Sequelize.STRING(30) },
      tracking_code: { type: Sequelize.STRING(60) },
      shipped_at: { type: Sequelize.DATE },
      delivered_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('orders', ['user_id']);
    await queryInterface.addIndex('orders', ['status']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('orders');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_status";');
  },
};
