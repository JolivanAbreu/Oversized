'use strict';
const { v4: uuidv4 } = require('uuid');

// URL base onde este backend serve os arquivos de /uploads. Se você rodar em
// outra porta ou já tiver feito deploy, ajuste API_BASE_URL abaixo (ou edite
// a URL de cada imagem depois, direto pelo painel administrativo — Produtos
// → editar → trocar a URL da imagem).
const API_BASE_URL = process.env.SEED_API_BASE_URL || 'http://localhost:3000';

function img(filename) {
  return `${API_BASE_URL}/uploads/${filename}`;
}

const PRODUCTS = [
  {
    name: 'Camiseta Oversized Draven Spider',
    slug: 'camiseta-oversized-draven-spider',
    description: 'Camiseta oversized preta com logo Draven e aranha bordada no detalhe. Peça assinatura da marca.',
    basePrice: 99.90,
    color: 'Preto',
    images: ['draven-spider-frente.jpg'],
  },
  {
    name: 'Camiseta Oversized Draven Comic Spider-Man',
    slug: 'camiseta-oversized-draven-comic-spiderman',
    description: 'Camiseta oversized branca com estampa em quadrinhos do Homem-Aranha nas costas e logo Draven.',
    basePrice: 109.90,
    color: 'Branco',
    images: ['draven-comic-spiderman-frente.jpg', 'draven-comic-spiderman-verso.jpg'],
  },
  {
    name: 'Camiseta Oversized The Amazing Draven',
    slug: 'camiseta-oversized-the-amazing-draven',
    description: "Camiseta oversized preta com estampa 'The Amazing Draven' em tons de laranja, inspirada em quadrinhos clássicos.",
    basePrice: 99.90,
    color: 'Preto',
    images: ['the-amazing-draven-frente.jpg'],
  },
  {
    name: 'Camiseta Oversized Draven Gótica',
    slug: 'camiseta-oversized-draven-gotica',
    description: 'Camiseta oversized preta com logo Draven em tipografia gótica vermelha.',
    basePrice: 94.90,
    color: 'Preto',
    images: ['draven-gotica-frente.jpg'],
  },
  {
    name: 'Camiseta Oversized Draven Miles Morales',
    slug: 'camiseta-oversized-draven-miles-morales',
    description: 'Camiseta oversized branca com logo Draven e ilustração de Miles Morales saltando entre prédios nas costas.',
    basePrice: 109.90,
    color: 'Branco',
    images: ['draven-miles-morales-frente.jpg', 'draven-miles-morales-verso.jpg'],
  },
  {
    name: 'Camiseta Oversized Draven Ouro',
    slug: 'camiseta-oversized-draven-ouro',
    description: 'Camiseta oversized marrom com logo Draven em dourado — peça mais discreta da coleção.',
    basePrice: 94.90,
    color: 'Marrom',
    images: ['draven-ouro-frente.jpg'],
  },
  {
    name: 'Camiseta Oversized Draven Anjo Guerreiro',
    slug: 'camiseta-oversized-draven-anjo-guerreiro',
    description: 'Camiseta oversized preta com logo Draven arqueado na frente e ilustração de anjo guerreiro nas costas.',
    basePrice: 109.90,
    color: 'Preto',
    images: ['draven-anjo-guerreiro-frente.jpg', 'draven-anjo-guerreiro-verso.jpg'],
  },
  {
    name: 'Camiseta Oversized Fatality',
    slug: 'camiseta-oversized-fatality',
    description: "Camiseta oversized vinho com estampa 'Fatality' nas costas, arte inspirada em jogos de luta retrô.",
    basePrice: 99.90,
    color: 'Vinho',
    images: ['fatality-verso.jpg'],
  },
  {
    name: 'Camiseta Oversized Draven Fine Spirits',
    slug: 'camiseta-oversized-draven-fine-spirits',
    description: "Camiseta oversized branca com logo 'Draven Fine Spirits', estampa delicada no peito com brasão e coração.",
    basePrice: 94.90,
    color: 'Branco',
    images: ['draven-fine-spirits-frente.jpg'],
  },
  {
    name: 'Camiseta Oversized Divine Custodian',
    slug: 'camiseta-oversized-divine-custodian',
    description: "Camiseta oversized preta com logo Draven rosa na frente e estampa 'Divine Custodian' (anjo protetor) nas costas.",
    basePrice: 109.90,
    color: 'Preto',
    images: ['divine-custodian-frente.jpg', 'divine-custodian-verso.jpg'],
  },
  {
    name: 'Camiseta Oversized Draven Matrix',
    slug: 'camiseta-oversized-draven-matrix',
    description: "Camiseta oversized preta com estampa gráfica em verde estilo 'matrix' e logo Draven.",
    basePrice: 94.90,
    color: 'Preto',
    images: ['draven-matrix-frente.jpg'],
  },
];

const SIZES = ['M', 'G', 'GG'];

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();

    // Reaproveita a categoria "Blusas Oversized" já criada pelo seeder de
    // demonstração; cria só se, por algum motivo, ela não existir.
    const [existingCategories] = await queryInterface.sequelize.query(
      `SELECT id FROM categories WHERE slug = 'blusas-oversized' LIMIT 1;`
    );
    let categoryId = existingCategories[0]?.id;
    if (!categoryId) {
      categoryId = uuidv4();
      await queryInterface.bulkInsert('categories', [{
        id: categoryId,
        name: 'Blusas Oversized',
        slug: 'blusas-oversized',
        description: 'Blusas de caimento largo',
        created_at: now,
        updated_at: now,
      }]);
    }

    for (const product of PRODUCTS) {
      const productId = uuidv4();

      await queryInterface.bulkInsert('products', [{
        id: productId,
        category_id: categoryId,
        name: product.name,
        slug: product.slug,
        description: product.description,
        fabric: '100% algodão',
        care_instructions: 'Lavar à mão ou ciclo delicado, não usar alvejante, secar à sombra.',
        base_price: product.basePrice,
        active: true,
        created_at: now,
        updated_at: now,
      }]);

      await queryInterface.bulkInsert(
        'product_variants',
        SIZES.map((size) => ({
          id: uuidv4(),
          product_id: productId,
          size,
          color: product.color,
          sku: `${product.slug.toUpperCase()}-${size}`,
          stock_quantity: 10,
          created_at: now,
          updated_at: now,
        }))
      );

      await queryInterface.bulkInsert(
        'product_images',
        product.images.map((filename, order) => ({
          id: uuidv4(),
          product_id: productId,
          url: img(filename),
          order,
          created_at: now,
          updated_at: now,
        }))
      );
    }
  },

  down: async (queryInterface) => {
    for (const product of PRODUCTS) {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT id FROM products WHERE slug = '${product.slug}' LIMIT 1;`
      );
      const productId = rows[0]?.id;
      if (!productId) continue;
      await queryInterface.bulkDelete('product_images', { product_id: productId });
      await queryInterface.bulkDelete('product_variants', { product_id: productId });
      await queryInterface.bulkDelete('products', { id: productId });
    }
  },
};
