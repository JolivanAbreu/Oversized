'use strict';
// Permite ao admin escolher onde um produto aparece em destaque na loja
// (banner principal da home ou fileira de destaques) — pedido do cliente:
// "admin possa escolher em qual card ou banner o produto deve aparecer".
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('products', 'featured_slot', {
      type: Sequelize.STRING(20), // null | 'banner' | 'destaque'
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('products', 'featured_slot');
  },
};
