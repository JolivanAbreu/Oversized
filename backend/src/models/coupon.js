'use strict';
module.exports = (sequelize, DataTypes) => {
  const Coupon = sequelize.define('Coupon', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    discountType: { type: DataTypes.ENUM('percentage', 'fixed'), allowNull: false, field: 'discount_type' },
    discountValue: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'discount_value' },
    minOrderValue: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'min_order_value' },
    validFrom: { type: DataTypes.DATE, allowNull: false, field: 'valid_from' },
    validUntil: { type: DataTypes.DATE, allowNull: false, field: 'valid_until' },
    usageLimit: { type: DataTypes.INTEGER, field: 'usage_limit' },
    usedCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'used_count' },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, {
    tableName: 'coupons',
    underscored: true,
  });

  return Coupon;
};
