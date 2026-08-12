'use strict';
// Enquadramento da imagem (object-position/background-position em CSS) —
// resolve o problema de fotos ficarem cortadas de forma ruim quando
// forçadas num box de proporção fixa (card, banner). O admin escolhe entre
// alguns presets (topo/centro/base), sem precisar editar a foto original.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('products', 'image_focal_point', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'center',
    });
    await queryInterface.addColumn('promo_banners', 'image_focal_point', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'center',
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('products', 'image_focal_point');
    await queryInterface.removeColumn('promo_banners', 'image_focal_point');
  },
};
