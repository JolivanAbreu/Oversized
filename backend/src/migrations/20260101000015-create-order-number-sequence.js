'use strict';
// Sequence dedicada do Postgres: garante números de pedido únicos e sequenciais
// mesmo sob concorrência, sem a necessidade de bloqueio manual de tabela.
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query('CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;');
  },
  down: async (queryInterface) => {
    await queryInterface.sequelize.query('DROP SEQUENCE IF EXISTS order_number_seq;');
  },
};
