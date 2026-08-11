import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Tag from './Tag';
import ProductMedia from './ProductMedia';
import { StarDisplay } from './StarRating';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuthModal } from '../context/AuthModalContext';
import { formatPrice } from '../lib/format';

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { isFavorite, toggle } = useWishlist();
  const { openLoginModal } = useAuthModal();
  const navigate = useNavigate();

  const [activeImg, setActiveImg] = useState(0);
  const [adding, setAdding] = useState(false);

  const images = product.images || [];
  const firstVariant = product.variants?.[0];
  const buyableVariant = product.variants?.find((v) => v.stockQuantity > 0);
  const outOfStock = !buyableVariant;
  const sizes = [...new Set((product.variants || []).map((v) => v.size))];
  const favorite = isFavorite(product.id);

  function showImage(index) {
    if (images.length === 0) return;
    setActiveImg((index + images.length) % images.length);
  }

  function handleFavoriteClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    toggle(product.id);
  }

  async function handleBuyBarClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    if (!buyableVariant || adding) return;
    setAdding(true);
    try {
      await addItem(buyableVariant.id, 1);
      navigate('/carrinho');
    } finally {
      setAdding(false);
    }
  }

  return (
    <Link to={`/produtos/${product.slug}`} className="group block">
      <div className="relative overflow-hidden border-2 border-ink bg-canvas-alt">
        {images.length > 0 ? (
          <div className="relative h-72 w-full">
            {images.map((img, i) => (
              <img
                key={img.id || i}
                src={img.url}
                alt={`${product.name} — foto ${i + 1}`}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${i === activeImg ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}
          </div>
        ) : (
          <ProductMedia product={product} color={firstVariant?.color} className="h-72 w-full" />
        )}

        {/* Bolinhas + setas de navegação — só aparecem se houver mais de uma
            foto (normalmente frente/verso, cadastradas pelo admin). */}
        {images.length > 1 && (
          <>
            <div className="absolute left-2.5 top-2.5 z-[5] flex flex-col gap-1.5">
              {images.map((img, i) => (
                <button
                  key={img.id || i}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); showImage(i); }}
                  aria-label={`Ver foto ${i + 1}`}
                  className={`h-2.5 w-2.5 rounded-full border border-ink transition-colors ${i === activeImg ? 'bg-ink' : 'bg-white'}`}
                />
              ))}
            </div>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); showImage(activeImg - 1); }}
              aria-label="Foto anterior"
              className="absolute left-1.5 top-1/2 z-[5] flex h-8 w-6 -translate-y-1/2 items-center justify-center rounded border border-ink/20 bg-white/70 text-xs opacity-0 transition-opacity group-hover:opacity-90"
            >
              ‹
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); showImage(activeImg + 1); }}
              aria-label="Próxima foto"
              className="absolute right-1.5 top-1/2 z-[5] flex h-8 w-6 -translate-y-1/2 items-center justify-center rounded border border-ink/20 bg-white/70 text-xs opacity-0 transition-opacity group-hover:opacity-90"
            >
              ›
            </button>
          </>
        )}

        {product.badgeLabel && (
          <div className="absolute left-2.5 top-2.5 z-[5] bg-ink px-2 py-1 text-xs font-black text-white">
            {product.badgeLabel}
          </div>
        )}

        <div className="absolute right-2.5 top-2.5 z-[5]">
          <Tag variant="tag">{formatPrice(product.basePrice)}</Tag>
        </div>
        {outOfStock && (
          <div className="absolute left-2.5 bottom-2.5 z-[5]">
            <Tag>esgotado</Tag>
          </div>
        )}

        {/* Barra "comprar" — só no hover (desktop), some se não houver
            estoque disponível em nenhuma variação. */}
        {!outOfStock && (
          <button
            onClick={handleBuyBarClick}
            disabled={adding}
            className="absolute inset-x-0 bottom-0 z-[5] flex h-8 translate-y-full items-center justify-center overflow-hidden border-t-2 border-ink bg-tag font-mono text-xs font-bold uppercase tracking-widest text-ink opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 disabled:cursor-wait"
          >
            {adding ? 'adicionando...' : 'comprar'}
          </button>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-xl leading-none tracking-tight">{product.name}</h3>
          <button onClick={handleFavoriteClick} aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} className="shrink-0 text-base leading-none">
            <span className={favorite ? 'text-danger' : 'text-ink-soft'}>{favorite ? '★' : '☆'}</span>
          </button>
        </div>
        <p className="mt-1 font-mono text-xs uppercase tracking-widest text-ink-soft">
          {sizes.join(' · ') || '—'}
        </p>
        {product.reviewCount > 0 && (
          <div className="mt-1 flex items-center gap-1.5">
            <StarDisplay value={product.avgRating} />
            <span className="font-mono text-[11px] text-ink-soft">({product.reviewCount})</span>
          </div>
        )}
      </div>
    </Link>
  );
}
