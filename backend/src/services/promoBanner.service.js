const { PromoBanner } = require('../models');

const DEFAULT_BANNER = {
  eyebrow: 'compre 3',
  title: 'camisetas',
  subtitle: 'e escolha o brinde',
  description: 'Escolha entre uma shoulder bag, um shorts, camiseta ou boné.',
  imageUrl: null,
  imageFocalPoint: 'center',
};

/**
 * Banner "singleton" — só existe uma linha ativa por vez. Se o admin nunca
 * configurou nada, devolve um texto padrão (mesma copy que a loja sempre
 * teve) em vez de deixar a seção vazia — mas assim que o admin salvar algo,
 * a linha real do banco passa a valer.
 */
async function getPromoBanner() {
  const banner = await PromoBanner.findOne({ where: { active: true }, order: [['updatedAt', 'DESC']] });
  if (!banner) return { ...DEFAULT_BANNER, isDefault: true };
  return { ...banner.toJSON(), isDefault: false };
}

async function upsertPromoBanner(payload) {
  const existing = await PromoBanner.findOne({ order: [['updatedAt', 'DESC']] });
  const { eyebrow, title, subtitle, description, imageUrl, imageFocalPoint } = payload;

  if (existing) {
    if (eyebrow !== undefined) existing.eyebrow = eyebrow;
    if (title !== undefined) existing.title = title;
    if (subtitle !== undefined) existing.subtitle = subtitle;
    if (description !== undefined) existing.description = description;
    if (imageUrl !== undefined) existing.imageUrl = imageUrl;
    if (imageFocalPoint !== undefined) existing.imageFocalPoint = imageFocalPoint;
    existing.active = true;
    await existing.save();
    return existing;
  }

  return PromoBanner.create({
    eyebrow: eyebrow ?? DEFAULT_BANNER.eyebrow,
    title: title ?? DEFAULT_BANNER.title,
    subtitle: subtitle ?? DEFAULT_BANNER.subtitle,
    description: description ?? DEFAULT_BANNER.description,
    imageUrl: imageUrl ?? null,
    imageFocalPoint: imageFocalPoint || 'center',
    active: true,
  });
}

module.exports = { getPromoBanner, upsertPromoBanner };
