import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useAuthModal } from '../context/AuthModalContext';
import ProductGallery from '../components/ProductGallery';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';
import FavoriteButton from '../components/FavoriteButton';
import { StarDisplay } from '../components/StarRating';
import ReviewsSection from '../components/ReviewsSection';
import { LoadingBlock, ErrorNotice } from '../components/States';
import { formatPrice } from '../lib/format';

export default function ProductDetail() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const { openLoginModal } = useAuthModal();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setProduct(null);
    setQuantity(1);
    api.get(`/products/${slug}`, { auth: false }).then((data) => {
      setProduct(data);
      setSelectedColor(data.variants?.[0]?.color || null);
      setSelectedSize(data.variants?.find((v) => v.color === data.variants?.[0]?.color)?.size || null);

      if (data.category?.slug) {
        api.get(`/products?category=${data.category.slug}`, { auth: false })
          .then((res) => setRelated((res.data || []).filter((p) => p.slug !== slug).slice(0, 4)))
          .catch(() => setRelated([]));
      }
    });
  }, [slug]);

  if (!product) return <div className="mx-auto max-w-7xl px-2.5 py-10 sm:px-4"><LoadingBlock label="Carregando produto" /></div>;

  const colors = [...new Set(product.variants.map((v) => v.color))];
  const sizesForColor = product.variants.filter((v) => v.color === selectedColor);
  const activeVariant = product.variants.find((v) => v.color === selectedColor && v.size === selectedSize);
  const price = activeVariant?.priceOverride ?? product.basePrice;
  const maxQty = activeVariant ? Math.min(activeVariant.stockQuantity, 10) : 1;

  async function handleAddToCart() {
    setError('');
    if (!activeVariant) {
      setError('Escolha tamanho e cor antes de adicionar à sacola.');
      return;
    }
    if (!isAuthenticated) {
      openLoginModal(`/produtos/${slug}`);
      return;
    }
    setAdding(true);
    try {
      await addItem(activeVariant.id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível adicionar à sacola.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-2.5 py-4 sm:px-4">
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-ink-soft">
        <Link to="/" className="hover:text-[#111111]">Início</Link>
        <span className="text-line">/</span>
        <Link to="/produtos" className="hover:text-[#111111]">Vestuário</Link>
        {product.category?.name && (
          <>
            <span className="text-line">/</span>
            <Link to={`/produtos?category=${product.category.slug}`} className="hover:text-[#111111]">{product.category.name}</Link>
          </>
        )}
        <span className="text-line">/</span>
        <span className="text-[#111111]">{product.name}</span>
      </nav>

      <div className="grid gap-10 rounded-lg bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.05)] sm:p-7 lg:grid-cols-2">
        <ProductGallery product={product} color={selectedColor} className="aspect-[3/4] w-full" />

        <div className="flex flex-col gap-4">
          {product.badgeLabel && (
            <span className="self-start rounded-sm bg-black px-2 py-1 text-[11px] font-black uppercase text-white">{product.badgeLabel}</span>
          )}
          <h1 className="text-[22px] font-black uppercase leading-tight text-[#111111]">{product.name}</h1>

          {product.reviewCount > 0 && (
            <div className="-mt-2 flex items-center gap-2">
              <StarDisplay value={product.avgRating} size="md" />
              <span className="font-mono text-xs text-ink-soft">{product.avgRating} · {product.reviewCount} avaliaç{product.reviewCount === 1 ? 'ão' : 'ões'}</span>
            </div>
          )}

          <p className="text-2xl font-black text-[#111111]">{formatPrice(price)}</p>

          <p className="max-w-md text-[13px] leading-relaxed text-[#444444]">{product.description}</p>

          <div className="flex flex-col gap-2.5">
            <p className="text-[11px] font-black uppercase tracking-wide text-[#111111]">Cor</p>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setSelectedColor(color);
                    const firstAvailable = product.variants.find((v) => v.color === color);
                    setSelectedSize(firstAvailable?.size || null);
                    setQuantity(1);
                  }}
                  className={`min-w-[42px] rounded border px-3 py-2 text-center font-mono text-xs font-black uppercase transition-colors ${
                    selectedColor === color ? 'border-[#111111] bg-[#111111] text-tag' : 'border-[#cccccc] bg-white text-[#333333] hover:border-[#111111]'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <p className="text-[11px] font-black uppercase tracking-wide text-[#111111]">Tamanho</p>
            <div className="flex flex-wrap gap-2">
              {sizesForColor.map((variant) => (
                <button
                  key={variant.id}
                  disabled={variant.stockQuantity === 0}
                  onClick={() => { setSelectedSize(variant.size); setQuantity(1); }}
                  className={`min-w-[42px] rounded border px-3 py-2 text-center font-mono text-xs font-black uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                    selectedSize === variant.size ? 'border-[#111111] bg-[#111111] text-tag' : 'border-[#cccccc] bg-white text-[#333333] hover:border-[#111111]'
                  }`}
                >
                  {variant.size}
                </button>
              ))}
            </div>
            {activeVariant && activeVariant.stockQuantity > 0 && activeVariant.stockQuantity <= 5 && (
              <p className="font-mono text-xs text-tag-dark">últimas {activeVariant.stockQuantity} unidades</p>
            )}
            {activeVariant && activeVariant.stockQuantity === 0 && (
              <p className="font-mono text-xs text-danger">esgotado nessa combinação</p>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            <p className="text-[11px] font-black uppercase tracking-wide text-[#111111]">Quantidade</p>
            <div className="flex items-center gap-3.5">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white text-sm font-black text-[#111111] shadow-[0_1px_3px_rgba(0,0,0,0.15)] disabled:opacity-30"
              >
                −
              </button>
              <span className="min-w-[20px] text-center text-sm font-black">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                disabled={quantity >= maxQty}
                className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white text-sm font-black text-[#111111] shadow-[0_1px_3px_rgba(0,0,0,0.15)] disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>

          <ErrorNotice message={error} />

          <div className="mt-1 flex items-center gap-3">
            <Button
              variant="tag"
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={adding || !activeVariant || activeVariant.stockQuantity === 0}
            >
              {added ? 'Adicionado ✓' : adding ? 'Adicionando...' : 'Adicionar à sacola'}
            </Button>
            <FavoriteButton productId={product.id} className="h-[52px] w-[52px] shrink-0 rounded" />
          </div>

          <div className="mt-1.5 flex flex-col gap-2 border-t border-dashed border-line pt-4 font-mono text-xs text-[#555555]">
            {product.fabric && <div className="flex items-center gap-2"><span className="text-ink-soft">◆</span> {product.fabric}</div>}
            {product.careInstructions && <div className="flex items-center gap-2"><span className="text-ink-soft">◆</span> {product.careInstructions}</div>}
          </div>
        </div>
      </div>

      <ReviewsSection productId={product.id} avgRating={product.avgRating} reviewCount={product.reviewCount} />

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="border-b-2 border-ink pb-2.5 text-[15px] font-black uppercase text-[#111111]">Você também pode gostar</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 pb-8 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
