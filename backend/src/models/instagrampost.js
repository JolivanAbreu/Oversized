'use strict';
module.exports = (sequelize, DataTypes) => {
  const InstagramPost = sequelize.define('InstagramPost', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    imageUrl: { type: DataTypes.STRING(500), allowNull: false, field: 'image_url' },
    postUrl: { type: DataTypes.STRING(500), allowNull: false, field: 'post_url' },
    caption: DataTypes.STRING(200),
    displayOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'display_order' },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    tableName: 'instagram_posts',
    underscored: true,
  });

  return InstagramPost;
};
