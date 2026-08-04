const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { Wishlist, Product, ProductImage } = require('../models');

const list = asyncHandler(async (req, res) => {
  const items = await Wishlist.findAll({
    where: { userId: req.user.id },
    include: [{ model: Product, as: 'product', include: [{ model: ProductImage, as: 'images', separate: true, limit: 1 }] }],
  });
  res.json(items);
});

const add = asyncHandler(async (req, res) => {
  const { product_id: productId } = req.body;
  if (!productId) throw ApiError.badRequest('product_id é obrigatório');

  const [item] = await Wishlist.findOrCreate({ where: { userId: req.user.id, productId } });
  res.status(201).json(item);
});

const remove = asyncHandler(async (req, res) => {
  await Wishlist.destroy({ where: { userId: req.user.id, productId: req.params.productId } });
  res.status(204).send();
});

module.exports = { list, add, remove };
