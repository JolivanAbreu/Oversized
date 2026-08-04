const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const productService = require('../services/product.service');
const { Review, User } = require('../models');

const list = asyncHandler(async (req, res) => {
  const { category, size, color, min_price: minPrice, max_price: maxPrice, sort, page } = req.query;
  const result = await productService.listProducts({ category, size, color, minPrice, maxPrice, sort, page });
  res.json(result);
});

const getBySlug = asyncHandler(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug);
  res.json(product);
});

const search = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) throw ApiError.badRequest('Parâmetro q é obrigatório');
  res.json(await productService.searchProducts(q));
});

const listCategories = asyncHandler(async (req, res) => {
  res.json(await productService.listCategories());
});

const listReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.findAll({
    where: { productId: req.params.id },
    include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
  });
  res.json(reviews);
});

// RF-37: só pode avaliar quem comprou e recebeu o produto
const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;

  if (!rating || rating < 1 || rating > 5) throw ApiError.badRequest('rating deve ser entre 1 e 5');

  const { Order, OrderItem, ProductVariant } = require('../models');
  const deliveredOrderWithProduct = await Order.findOne({
    where: { userId: req.user.id, status: 'entregue' },
    include: [{
      model: OrderItem, as: 'items',
      include: [{ model: ProductVariant, as: 'variant', where: { productId } }],
      required: true,
    }],
  });

  if (!deliveredOrderWithProduct) {
    throw ApiError.forbidden('Você só pode avaliar produtos de pedidos já entregues', 'purchase_not_delivered');
  }

  const existing = await Review.findOne({ where: { productId, userId: req.user.id } });
  if (existing) throw ApiError.conflict('Você já avaliou este produto');

  const review = await Review.create({ productId, userId: req.user.id, rating, comment });
  res.status(201).json(review);
});

module.exports = { list, getBySlug, search, listCategories, listReviews, createReview };
