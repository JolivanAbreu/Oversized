const { Category, Product, sequelize } = require('../models');
const ApiError = require('../utils/apiError');

async function listCategoriesWithProductCount() {
  const categories = await Category.findAll({ order: [['name', 'ASC']] });
  const counts = await Product.findAll({
    attributes: ['categoryId', [sequelize.fn('COUNT', sequelize.col('id')), 'productCount']],
    group: ['categoryId'],
    raw: true,
  });
  const countByCategory = Object.fromEntries(counts.map((c) => [c.categoryId, Number(c.productCount)]));

  return categories.map((c) => {
    const json = c.toJSON();
    json.productCount = countByCategory[c.id] || 0;
    return json;
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function createCategory({ name, description }) {
  if (!name) throw ApiError.badRequest('name é obrigatório');
  const slug = slugify(name);

  const existing = await Category.findOne({ where: { slug } });
  if (existing) throw ApiError.conflict('Já existe uma categoria com esse nome', 'category_already_exists');

  return Category.create({ name, slug, description });
}

async function updateCategory(id, { name, description }) {
  const category = await Category.findByPk(id);
  if (!category) throw ApiError.notFound('Categoria não encontrada');

  if (name !== undefined) {
    category.name = name;
    category.slug = slugify(name);
  }
  if (description !== undefined) category.description = description;

  await category.save();
  return category;
}

async function deleteCategory(id) {
  const category = await Category.findByPk(id);
  if (!category) throw ApiError.notFound('Categoria não encontrada');

  const productCount = await Product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw ApiError.conflict(
      `Esta categoria tem ${productCount} produto(s) cadastrado(s). Mova-os para outra categoria antes de excluir.`,
      'category_has_products'
    );
  }

  await category.destroy();
}

module.exports = { listCategoriesWithProductCount, createCategory, updateCategory, deleteCategory };
