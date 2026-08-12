'use strict';
// Galeria do Instagram curada pelo admin: posts REAIS (link + foto real do
// post), adicionados manualmente pelo painel — não é uma sincronização
// automática via API do Meta (isso exigiria app registrado no Meta for
// Developers, conta Business vinculada e renovação periódica de token; ver
// discussão no README do backend). É conteúdo verdadeiro, só que curado à
// mão em vez de sincronizado ao vivo.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('instagram_posts', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      image_url: { type: Sequelize.STRING(500), allowNull: false },
      post_url: { type: Sequelize.STRING(500), allowNull: false },
      caption: { type: Sequelize.STRING(200) },
      display_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('instagram_posts');
  },
};
