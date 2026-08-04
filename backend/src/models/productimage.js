'use strict';
module.exports = (sequelize, DataTypes) => {
  const ProductImage = sequelize.define('ProductImage', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    productId: { type: DataTypes.UUID, allowNull: false, field: 'product_id' },
    url: { type: DataTypes.STRING(500), allowNull: false },
    order: { type: DataTypes.INTEGER, defaultValue: 0 },
  }, {
    tableName: 'product_images',
    underscored: true,
  });

  ProductImage.associate = (models) => {
    ProductImage.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
  };

  return ProductImage;
};
