const { Op } = require('sequelize');
const { Product, ProductVariant, ProductImage, Category, sequelize } = require('../models');
const ApiError = require('../utils/apiError');

const PAGE_SIZE = 20;

const SORT_MAP = {
  newest: [['createdAt', 'DESC']],
  price_asc: [['basePrice', 'ASC']],
  price_desc: [['basePrice', 'DESC']],
  best_selling: [['createdAt', 'DESC']], // ligação com order_items.sum(quantity) é feita em relatórios (documento 3, seção de índices)
};

async function listProducts({ category, size, color, minPrice, maxPrice, sort, page = 1 }) {
  const where = { active: true };
  const variantWhere = {};

  if (minPrice) where.basePrice = { ...where.basePrice, [Op.gte]: minPrice };
  if (maxPrice) where.basePrice = { ...where.basePrice, [Op.lte]: maxPrice };
  if (size) variantWhere.size = size;
  if (color) variantWhere.color = color;

  const include = [
    { model: ProductVariant, as: 'variants', required: !!(size || color), where: Object.keys(variantWhere).length ? variantWhere : undefined },
    { model: ProductImage, as: 'images', separate: true, order: [['order', 'ASC']] },
    { model: Category, as: 'category', required: !!category, where: category ? { slug: category } : undefined },
  ];

  const { rows, count } = await Product.findAndCountAll({
    where,
    include,
    distinct: true,
    order: SORT_MAP[sort] || SORT_MAP.newest,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  return { data: rows, page: Number(page), totalPages: Math.ceil(count / PAGE_SIZE), total: count };
}

async function getProductBySlug(slug) {
  const product = await Product.findOne({
    where: { slug, active: true },
    include: [
      { model: ProductVariant, as: 'variants' },
      { model: ProductImage, as: 'images', separate: true, order: [['order', 'ASC']] },
      { model: Category, as: 'category' },
    ],
  });
  if (!product) throw ApiError.notFound('Produto não encontrado');
  return product;
}

async function searchProducts(query) {
  return Product.findAll({
    where: {
      active: true,
      [Op.or]: [
        { name: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } },
      ],
    },
    limit: 10,
    include: [{ model: ProductImage, as: 'images', separate: true, limit: 1, order: [['order', 'ASC']] }],
  });
}

async function listCategories() {
  return Category.findAll({ order: [['name', 'ASC']] });
}

// --- Admin ---

const ADMIN_PAGE_SIZE = 30;

/**
 * Lista produtos para o painel administrativo — ao contrário de listProducts
 * (loja pública), inclui produtos inativos, já que o operador precisa
 * encontrá-los para reativar ou ajustar estoque.
 */
async function listProductsForAdmin({ search, page = 1 } = {}) {
  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { slug: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { rows, count } = await Product.findAndCountAll({
    where,
    include: [
      { model: ProductVariant, as: 'variants' },
      { model: Category, as: 'category' },
      { model: ProductImage, as: 'images', separate: true, limit: 1, order: [['order', 'ASC']] },
    ],
    distinct: true,
    order: [['createdAt', 'DESC']],
    limit: ADMIN_PAGE_SIZE,
    offset: (page - 1) * ADMIN_PAGE_SIZE,
  });

  return { data: rows, page: Number(page), totalPages: Math.ceil(count / ADMIN_PAGE_SIZE), total: count };
}

async function getProductForAdmin(id, { transaction } = {}) {
  const product = await Product.findByPk(id, {
    include: [
      { model: ProductVariant, as: 'variants' },
      { model: ProductImage, as: 'images', separate: true, order: [['order', 'ASC']] },
      { model: Category, as: 'category' },
    ],
    transaction,
  });
  if (!product) throw ApiError.notFound('Produto não encontrado');
  return product;
}

async function createProduct(payload) {
  const created = await sequelize.transaction(async (transaction) => {
    const product = await Product.create({
      categoryId: payload.categoryId,
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      fabric: payload.fabric,
      careInstructions: payload.careInstructions,
      basePrice: payload.basePrice,
      active: payload.active ?? true,
    }, { transaction });

    if (Array.isArray(payload.variants)) {
      await ProductVariant.bulkCreate(
        payload.variants.map((v) => ({ ...v, productId: product.id })),
        { transaction }
      );
    }
    if (Array.isArray(payload.images)) {
      await ProductImage.bulkCreate(
        payload.images.map((img, idx) => ({ url: img.url, order: img.order ?? idx, productId: product.id })),
        { transaction }
      );
    }
    return product;
  });

  return getProductForAdmin(created.id);
}

async function updateProduct(id, payload) {
  await sequelize.transaction(async (transaction) => {
    const product = await Product.findByPk(id, { transaction });
    if (!product) throw ApiError.notFound('Produto não encontrado');

    const { variants, images, ...productFields } = payload;
    await product.update(productFields, { transaction });

    // Variações: atualiza as que já têm id, cria as novas. Nunca exclui aqui
    // — remover uma variação com pedidos associados quebraria o histórico
    // (FK RESTRICT em order_items); para "aposentar" uma variação, zere o
    // estoque em vez de excluí-la.
    if (Array.isArray(variants)) {
      for (const variant of variants) {
        if (variant.id) {
          await ProductVariant.update(
            {
              size: variant.size,
              color: variant.color,
              sku: variant.sku,
              stockQuantity: variant.stockQuantity,
              priceOverride: variant.priceOverride ?? null,
            },
            { where: { id: variant.id, productId: id }, transaction }
          );
        } else {
          await ProductVariant.create({ ...variant, productId: id }, { transaction });
        }
      }
    }

    // Imagens: substitui a lista inteira — não há histórico de pedido
    // dependente de imagem, então é seguro recriar do zero a cada edição.
    if (Array.isArray(images)) {
      await ProductImage.destroy({ where: { productId: id }, transaction });
      await ProductImage.bulkCreate(
        images.map((img, idx) => ({ url: img.url, order: img.order ?? idx, productId: id })),
        { transaction }
      );
    }
  });

  // Recarrega após o commit — mais simples e seguro do que depender de
  // includes com separate:true enxergarem a transação em aberto.
  return getProductForAdmin(id);
}

async function deactivateProduct(id) {
  // Exclusão lógica: preserva o histórico de order_items (documento 3, seção 4)
  const product = await Product.findByPk(id);
  if (!product) throw ApiError.notFound('Produto não encontrado');
  await product.update({ active: false });
}

async function reactivateProduct(id) {
  const product = await Product.findByPk(id);
  if (!product) throw ApiError.notFound('Produto não encontrado');
  await product.update({ active: true });
  return product;
}

module.exports = {
  listProducts,
  getProductBySlug,
  searchProducts,
  listCategories,
  createProduct,
  updateProduct,
  deactivateProduct,
  reactivateProduct,
  listProductsForAdmin,
  getProductForAdmin,
};
