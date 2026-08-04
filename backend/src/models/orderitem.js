'use strict';
module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderId: { type: DataTypes.UUID, allowNull: false, field: 'order_id' },
    variantId: { type: DataTypes.UUID, allowNull: false, field: 'variant_id' },
    quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'unit_price' },
  }, {
    tableName: 'order_items',
    underscored: true,
  });

  OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' });
    OrderItem.belongsTo(models.ProductVariant, { foreignKey: 'variantId', as: 'variant' });
  };

  return OrderItem;
};
