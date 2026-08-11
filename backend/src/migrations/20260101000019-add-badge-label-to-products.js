'use strict';
// Rótulo curto e livre que o admin pode colocar no canto do card do produto
// (ex.: "LANÇAMENTO", "BESTSELLER"). É texto livre, não um desconto
// calculado — evita fabricar porcentagens falsas de desconto que o sistema
// não tem como sustentar de verdade (não existe um "preço antigo" salvo).
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('products', 'badge_label', {
      type: Sequelize.STRING(30),
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('products', 'badge_label');
  },
};
