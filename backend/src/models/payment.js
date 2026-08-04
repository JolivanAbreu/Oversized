'use strict';
module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderId: { type: DataTypes.UUID, allowNull: false, field: 'order_id' },
    method: { type: DataTypes.ENUM('card', 'pix'), allowNull: false },
    providerPaymentId: { type: DataTypes.STRING(60), unique: true, field: 'provider_payment_id' },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    installments: { type: DataTypes.INTEGER },
    pixQrCode: { type: DataTypes.TEXT, field: 'pix_qr_code' },
    pixCopyPaste: { type: DataTypes.TEXT, field: 'pix_copy_paste' },
    pixExpiration: { type: DataTypes.DATE, field: 'pix_expiration' },
    paidAt: { type: DataTypes.DATE, field: 'paid_at' },
  }, {
    tableName: 'payments',
    underscored: true,
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' });
  };

  return Payment;
};
