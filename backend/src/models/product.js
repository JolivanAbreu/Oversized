'use strict';
module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    categoryId: { type: DataTypes.UUID, allowNull: false, field: 'category_id' },
    name: { type: DataTypes.STRING(150), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    fabric: { type: DataTypes.STRING(100) },
    careInstructions: { type: DataTypes.TEXT, field: 'care_instructions' },
    basePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'base_price' },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, {
    tableName: 'products',
    underscored: true,
  });

  Product.associate = (models) => {
    Product.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
    Product.hasMany(models.ProductVariant, { foreignKey: 'productId', as: 'variants' });
    Product.hasMany(models.ProductImage, { foreignKey: 'productId', as: 'images' });
    Product.hasMany(models.Review, { foreignKey: 'productId', as: 'reviews' });
    Product.hasMany(models.Wishlist, { foreignKey: 'productId', as: 'wishlistedBy' });
  };

  return Product;
};
