'use strict';
// Banner promocional configurável pelo admin (imagem + textos), exibido no
// topo da home. Modelado como uma "configuração singleton" — só existe uma
// linha ativa por vez, criada/atualizada via upsert no service, nunca uma
// lista de banners.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('promo_banners', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      eyebrow: { type: Sequelize.STRING(60) },
      title: { type: Sequelize.STRING(60) },
      subtitle: { type: Sequelize.STRING(120) },
      description: { type: Sequelize.STRING(300) },
      image_url: { type: Sequelize.STRING(500) },
      active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('promo_banners');
  },
};
