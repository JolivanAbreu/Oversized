import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import StatusPill from '../components/StatusPill';
import { LoadingBlock, EmptyState } from '../components/States';
import { formatPrice } from '../lib/format';

export default function Products() {
  const { isAdmin } = useAuth();
  const [result, setResult] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  function load(query = '') {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    api.get(`/admin/products?${params.toString()}`)
      .then(setResult)
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    load(search);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Produtos</h1>
          <p className="mt-1 text-sm text-ink-soft">{result?.total ?? '—'} produtos cadastrados</p>
        </div>
        {isAdmin && <Button as={Link} to="/produtos/novo">+ Novo produto</Button>}
      </div>

      <form onSubmit={handleSearchSubmit} className="mt-6 flex gap-2">
        <input
          className="w-full max-w-sm rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-ink"
          placeholder="Buscar por nome ou slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="secondary">Buscar</Button>
      </form>

      <div className="mt-6 overflow-hidden rounded-lg border border-line bg-white">
        {loading && <div className="p-6"><LoadingBlock label="Carregando produtos" /></div>}

        {!loading && result?.data?.length === 0 && (
          <div className="p-6"><EmptyState title="Nenhum produto encontrado" /></div>
        )}

        {!loading && result?.data?.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-3"></th>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Variações</th>
                <th className="px-4 py-3">Estoque total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((product) => {
                const totalStock = product.variants?.reduce((sum, v) => sum + v.stockQuantity, 0) || 0;
                return (
                  <tr key={product.id} className="border-b border-line last:border-0 hover:bg-canvas">
                    <td className="px-4 py-3">
                      {product.images?.[0]?.url ? (
                        <img src={product.images[0].url} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-canvas-alt" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{product.name}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{product.category?.name || '—'}</td>
                    <td className="px-4 py-3 font-mono">{formatPrice(product.basePrice)}</td>
                    <td className="px-4 py-3 text-ink-soft">{product.variants?.length || 0}</td>
                    <td className="px-4 py-3 font-mono">
                      {totalStock === 0 ? <span className="text-danger">0</span> : totalStock}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill label={product.active ? 'Ativo' : 'Inativo'} tone={product.active ? 'lime' : 'neutral'} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/produtos/${product.id}`}>
                        <Button variant="secondary" size="sm">Editar</Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
