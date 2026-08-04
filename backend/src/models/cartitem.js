'use strict';
module.exports = (sequelize, DataTypes) => {
  const CartItem = sequelize.define('CartItem', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    cartId: { type: DataTypes.UUID, allowNull: false, field: 'cart_id' },
    variantId: { type: DataTypes.UUID, allowNull: false, field: 'variant_id' },
    quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  }, {
    tableName: 'cart_items',
    underscored: true,
    indexes: [{ unique: true, fields: ['cart_id', 'variant_id'] }],
  });

  CartItem.associate = (models) => {
    CartItem.belongsTo(models.Cart, { foreignKey: 'cartId', as: 'cart' });
    CartItem.belongsTo(models.ProductVariant, { foreignKey: 'variantId', as: 'variant' });
  };

  return CartItem;
};
