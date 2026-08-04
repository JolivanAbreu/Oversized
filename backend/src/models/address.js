'use strict';
module.exports = (sequelize, DataTypes) => {
  const Address = sequelize.define('Address', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    label: { type: DataTypes.STRING(50) },
    street: { type: DataTypes.STRING(200), allowNull: false },
    number: { type: DataTypes.STRING(20), allowNull: false },
    complement: { type: DataTypes.STRING(100) },
    neighborhood: { type: DataTypes.STRING(100), allowNull: false },
    city: { type: DataTypes.STRING(100), allowNull: false },
    state: { type: DataTypes.STRING(2), allowNull: false },
    zip: { type: DataTypes.STRING(9), allowNull: false },
    isDefault: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_default' },
  }, {
    tableName: 'addresses',
    underscored: true,
  });

  Address.associate = (models) => {
    Address.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Address.hasMany(models.Order, { foreignKey: 'addressId', as: 'orders' });
  };

  return Address;
};
