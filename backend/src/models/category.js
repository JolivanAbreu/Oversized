'use strict';
module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
  }, {
    tableName: 'categories',
    underscored: true,
  });

  Category.associate = (models) => {
    Category.hasMany(models.Product, { foreignKey: 'categoryId', as: 'products' });
  };

  return Category;
};
