const { InstagramPost } = require('../models');
const ApiError = require('../utils/apiError');

async function listActivePosts(limit = 6) {
  return InstagramPost.findAll({
    where: { active: true },
    order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']],
    limit,
  });
}

async function listAllPosts() {
  return InstagramPost.findAll({ order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']] });
}

async function createPost({ imageUrl, postUrl, caption, displayOrder }) {
  if (!imageUrl) throw ApiError.badRequest('imageUrl é obrigatório');
  if (!postUrl) throw ApiError.badRequest('postUrl é obrigatório (link do post real no Instagram)');

  return InstagramPost.create({
    imageUrl,
    postUrl,
    caption: caption || null,
    displayOrder: displayOrder ?? 0,
    active: true,
  });
}

async function updatePost(id, payload) {
  const post = await InstagramPost.findByPk(id);
  if (!post) throw ApiError.notFound('Post não encontrado');

  const { imageUrl, postUrl, caption, displayOrder, active } = payload;
  if (imageUrl !== undefined) post.imageUrl = imageUrl;
  if (postUrl !== undefined) post.postUrl = postUrl;
  if (caption !== undefined) post.caption = caption;
  if (displayOrder !== undefined) post.displayOrder = displayOrder;
  if (active !== undefined) post.active = active;

  await post.save();
  return post;
}

async function deletePost(id) {
  const deleted = await InstagramPost.destroy({ where: { id } });
  if (!deleted) throw ApiError.notFound('Post não encontrado');
}

module.exports = { listActivePosts, listAllPosts, createPost, updatePost, deletePost };
