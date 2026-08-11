'use strict';
// Distingue "a loja entra em contato" (combinar com o vendedor) de "o
// cliente pede sozinho num app externo" (Uber Flash, 99) — as duas situações
// já compartilhavam requires_shipping_arrangement=true, mas precisam de
// telas/avisos diferentes no frontend (uma mostra o WhatsApp da loja, a
// outra só orienta a pedir no app).
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orders', 'shipping_contact_method', {
      type: Sequelize.STRING(20), // 'store' | 'customer_app' | null
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('orders', 'shipping_contact_method');
  },
};
