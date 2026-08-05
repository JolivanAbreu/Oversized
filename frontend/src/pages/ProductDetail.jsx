import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductMedia from '../components/ProductMedia';
import Tag from '../components/Tag';
import Button from '../components/Button';
import { LoadingBlock, ErrorNotice } from '../components/States';
import { formatPrice } from '../lib/format';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setProduct(null);
    api.get(`/products/${slug}`, { auth: false }).then((data) => {
      setProduct(data);
      setSelectedColor(data.variants?.[0]?.color || null);
      setSelectedSize(data.variants?.find((v) => v.color === data.variants?.[0]?.color)?.size || null);
    });
  }, [slug]);

  if (!product) return <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8"><LoadingBlock label="Carregando produto" /></div>;

  const colors = [...new Set(product.variants.map((v) => v.color))];
  const sizesForColor = product.variants.filter((v) => v.color === selectedColor);
  const activeVariant = product.variants.find((v) => v.color === selectedColor && v.size === selectedSize);
  const price = activeVariant?.priceOverride ?? product.basePrice;

  async function handleAddToCart() {
    setError('');
    if (!activeVariant) {
      setError('Escolha tamanho e cor antes de adicionar à sacola.');
      return;
    }
    if (!isAuthenticated) {
      navigate('/entrar', { state: { redirectTo: `/produtos/${slug}` } });
      return;
    }
    setAdding(true);
    try {
      await addItem(activeVariant.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível adicionar à sacola.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="relative border-2 border-ink bg-canvas-alt">
          <ProductMedia product={product} color={selectedColor} className="h-[32rem] w-full" />
          <div className="absolute left-4 top-4">
            <Tag variant="tag">{formatPrice(price)}</Tag>
          </div>
        </div>

        <div>
          <h1 className="font-display text-5xl leading-none">{product.name}</h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft">{product.description}</p>

          <div className="mt-8 space-y-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">Cor</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      const firstAvailable = product.variants.find((v) => v.color === color);
                      setSelectedSize(firstAvailable?.size || null);
                    }}
                    className={`border-2 px-4 py-2 font-mono text-xs uppercase ${selectedColor === color ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink'}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">Tamanho</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sizesForColor.map((variant) => (
                  <button
                    key={variant.id}
                    disabled={variant.stockQuantity === 0}
                    onClick={() => setSelectedSize(variant.size)}
                    className={`border-2 px-4 py-2 font-mono text-xs uppercase disabled:cursor-not-allowed disabled:opacity-30 ${selectedSize === variant.size ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink'}`}
                  >
                    {variant.size}
                  </button>
                ))}
              </div>
              {activeVariant && activeVariant.stockQuantity > 0 && activeVariant.stockQuantity <= 5 && (
                <p className="mt-2 font-mono text-xs text-tag">últimas {activeVariant.stockQuantity} unidades</p>
              )}
              {activeVariant && activeVariant.stockQuantity === 0 && (
                <p className="mt-2 font-mono text-xs text-danger">esgotado nessa combinação</p>
              )}
            </div>

            <ErrorNotice message={error} />

            <Button
              variant="tag"
              size="lg"
              className="w-full sm:w-auto"
              onClick={handleAddToCart}
              disabled={adding || !activeVariant || activeVariant.stockQuantity === 0}
            >
              {added ? 'Adicionado ✓' : adding ? 'Adicionando...' : 'Adicionar à sacola'}
            </Button>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-4 border-t-2 border-line pt-6 font-mono text-xs">
            {product.fabric && (
              <div>
                <dt className="uppercase text-ink-soft">Tecido</dt>
                <dd className="mt-1">{product.fabric}</dd>
              </div>
            )}
            {product.careInstructions && (
              <div>
                <dt className="uppercase text-ink-soft">Cuidados</dt>
                <dd className="mt-1">{product.careInstructions}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
