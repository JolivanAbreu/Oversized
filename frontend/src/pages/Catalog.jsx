import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import ProductCard from '../components/ProductCard';
import { LoadingBlock, EmptyState } from '../components/States';

const SIZES = ['P', 'M', 'G', 'GG', 'XG'];
const SORT_OPTIONS = [
  ['newest', 'Mais recentes'],
  ['price_asc', 'Menor preço'],
  ['price_desc', 'Maior preço'],
];

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const size = searchParams.get('size') || '';
  const sort = searchParams.get('sort') || 'newest';

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (searchParams.get('category')) query.set('category', searchParams.get('category'));
    if (size) query.set('size', size);
    if (sort) query.set('sort', sort);

    api.get(`/products?${query.toString()}`, { auth: false })
      .then(setResult)
      .catch(() => setResult({ data: [] }))
      .finally(() => setLoading(false));
  }, [searchParams, size, sort]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-5xl">Loja</h1>

      <div className="mt-8 flex flex-col gap-4 border-y-2 border-ink py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-ink-soft">Tamanho:</span>
          <button
            onClick={() => updateParam('size', '')}
            className={`border-2 px-3 py-1 font-mono text-xs ${!size ? 'border-ink bg-ink text-white' : 'border-line text-ink-soft'}`}
          >
            Todos
          </button>
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => updateParam('size', s)}
              className={`border-2 px-3 py-1 font-mono text-xs ${size === s ? 'border-ink bg-ink text-white' : 'border-line text-ink-soft hover:border-ink'}`}
            >
              {s}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-soft">
          Ordenar por
          <select
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="border-2 border-ink bg-white px-3 py-1.5 text-ink"
          >
            {SORT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-10">
        {loading && <LoadingBlock label="Buscando peças" />}
        {!loading && result?.data?.length === 0 && (
          <EmptyState title="Nada por aqui" description="Nenhum produto encontrado com esse filtro. Tente outro tamanho." />
        )}
        {!loading && result?.data?.length > 0 && (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {result.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
