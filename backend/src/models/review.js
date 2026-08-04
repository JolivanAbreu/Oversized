'use strict';
module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('Review', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    productId: { type: DataTypes.UUID, allowNull: false, field: 'product_id' },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    rating: { type: DataTypes.SMALLINT, allowNull: false, validate: { min: 1, max: 5 } },
    comment: { type: DataTypes.TEXT },
  }, {
    tableName: 'reviews',
    underscored: true,
    indexes: [{ unique: true, fields: ['product_id', 'user_id'] }],
  });

  Review.associate = (models) => {
    Review.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' });
    Review.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Review;
};
