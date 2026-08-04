import { Link } from 'react-router-dom';
import Tag from './Tag';
import GarmentArt from './GarmentArt';
import { formatPrice } from '../lib/format';

export default function ProductCard({ product }) {
  const firstVariant = product.variants?.[0];
  const outOfStock = product.variants?.every((v) => v.stockQuantity === 0);
  const sizes = [...new Set((product.variants || []).map((v) => v.size))];

  return (
    <Link to={`/produtos/${product.slug}`} className="group block">
      <div className="relative overflow-hidden border-2 border-ink bg-canvas-alt">
        <GarmentArt color={firstVariant?.color} className="h-72 w-full transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute left-3 top-3">
          <Tag variant="tag">{formatPrice(product.basePrice)}</Tag>
        </div>
        {outOfStock && (
          <div className="absolute right-3 top-3">
            <Tag>esgotado</Tag>
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="font-display text-xl leading-none tracking-tight">{product.name}</h3>
        <p className="mt-1 font-mono text-xs uppercase tracking-widest text-ink-soft">
          {sizes.join(' · ') || '—'}
        </p>
      </div>
    </Link>
  );
}
