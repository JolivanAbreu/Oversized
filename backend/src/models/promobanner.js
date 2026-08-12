'use strict';
module.exports = (sequelize, DataTypes) => {
  const PromoBanner = sequelize.define('PromoBanner', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    eyebrow: DataTypes.STRING(60),
    title: DataTypes.STRING(60),
    subtitle: DataTypes.STRING(120),
    description: DataTypes.STRING(300),
    imageUrl: { type: DataTypes.STRING(500), field: 'image_url' },
    imageFocalPoint: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'center', field: 'image_focal_point' },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    tableName: 'promo_banners',
    underscored: true,
  });

  return PromoBanner;
};
