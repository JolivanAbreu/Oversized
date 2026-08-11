'use strict';
// Guarda qual opção de frete foi escolhida no pedido — antes só o valor
// (shipping_cost) era persistido, o que não permitia saber depois se o
// pedido usava "combinar com o vendedor" (necessário para acionar o contato
// via WhatsApp) ou qual transportadora foi selecionada.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orders', 'shipping_method', {
      type: Sequelize.STRING(30),
      allowNull: true,
    });
    await queryInterface.addColumn('orders', 'shipping_method_name', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('orders', 'requires_shipping_arrangement', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('orders', 'shipping_method');
    await queryInterface.removeColumn('orders', 'shipping_method_name');
    await queryInterface.removeColumn('orders', 'requires_shipping_arrangement');
  },
};
