'use strict';
module.exports = (sequelize, DataTypes) => {
  const Wishlist = sequelize.define('Wishlist', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    productId: { type: DataTypes.UUID, allowNull: false, field: 'product_id' },
  }, {
    tableName: 'wishlists',
    underscored: true,
    indexes: [{ unique: true, fields: ['user_id', 'product_id'] }],
  });

  Wishlist.associate = (models) => {
    Wishlist.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Wishlist.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
  };

  return Wishlist;
};
