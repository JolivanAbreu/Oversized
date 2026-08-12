import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';
import { LoadingBlock, EmptyState } from '../components/States';

export default function Favorites() {
  const { items, loading } = useWishlist();

  return (
    <div className="mx-auto max-w-7xl px-2.5 py-4 sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-6 pb-4 shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
        <h1 className="flex flex-wrap items-center gap-2.5 text-[22px] font-black uppercase text-[#111111]">
          <span className="text-danger">★</span> Meus Favoritos <span className="text-sm font-bold text-ink-soft">({items.length} {items.length === 1 ? 'item' : 'itens'})</span>
        </h1>
        <Link
          to="/produtos"
          className="inline-flex items-center gap-2 rounded border border-[#cccccc] px-4 py-2.5 font-mono text-[11px] font-black uppercase text-[#333333] transition-colors hover:border-[#111111] hover:bg-[#f8f8f8]"
        >
          ← Continuar a comprar
        </Link>
      </div>

      {loading && <div className="mt-8"><LoadingBlock label="Carregando favoritos" /></div>}

      {!loading && items.length === 0 && (
        <div className="mt-6">
          <EmptyState
            title="Sua lista de favoritos está vazia"
            description="Clique na estrela dos produtos para salvá-los aqui!"
            icon="☆"
            action={<Button as={Link} to="/produtos" variant="tag">Explorar Coleção</Button>}
          />
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-2 pb-8 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ProductCard key={item.id} product={item.product} />
          ))}
        </div>
      )}
    </div>
  );
}
