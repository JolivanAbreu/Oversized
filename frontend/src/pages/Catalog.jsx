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
  const [categories, setCategories] = useState([]);

  const size = searchParams.get('size') || '';
  const sort = searchParams.get('sort') || 'newest';
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  useEffect(() => {
    api.get('/categories', { auth: false }).then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);

    if (search) {
      api.get(`/products/search?q=${encodeURIComponent(search)}`, { auth: false })
        .then((data) => setResult({ data }))
        .catch(() => setResult({ data: [] }))
        .finally(() => setLoading(false));
      return;
    }

    const query = new URLSearchParams();
    if (category) query.set('category', category);
    if (size) query.set('size', size);
    if (sort) query.set('sort', sort);

    api.get(`/products?${query.toString()}`, { auth: false })
      .then(setResult)
      .catch(() => setResult({ data: [] }))
      .finally(() => setLoading(false));
  }, [searchParams, size, sort, search, category]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-5xl">{search ? `Resultados para "${search}"` : 'Coleção Vestuário'}</h1>

      {!search && categories.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2.5 sm:justify-start">
          <button
            onClick={() => updateParam('category', '')}
            className={`rounded-full border px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wide transition-colors ${
              !category ? 'border-ink bg-ink text-tag' : 'border-line bg-white text-ink-soft hover:border-ink'
            }`}
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => updateParam('category', c.slug)}
              className={`rounded-full border px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wide transition-colors ${
                category === c.slug ? 'border-ink bg-ink text-tag' : 'border-line bg-white text-ink-soft hover:border-ink'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {!search && (
      <div className="mt-6 flex flex-col gap-4 border-y-2 border-ink py-4 sm:flex-row sm:items-center sm:justify-between">
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
      )}

      <div className="mt-10">
        {loading && <LoadingBlock label="Buscando peças" />}
        {!loading && result?.data?.length === 0 && (
          <EmptyState title="Nada por aqui" description="Nenhum produto encontrado com esse filtro. Tente outra categoria ou tamanho." />
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
