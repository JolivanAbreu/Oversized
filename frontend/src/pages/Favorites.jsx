import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';
import { LoadingBlock, EmptyState } from '../components/States';

export default function Favorites() {
  const { items, loading } = useWishlist();

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <div className="flex items-center justify-between border-b-2 border-ink pb-4">
        <h1 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">
          Meus favoritos <span className="text-base font-normal text-ink-soft">({items.length} {items.length === 1 ? 'item' : 'itens'})</span>
        </h1>
        <Link to="/produtos" className="hidden font-mono text-xs uppercase tracking-widest text-ink-soft underline decoration-dotted hover:text-tag-dark sm:block">
          ← Continuar comprando
        </Link>
      </div>

      {loading && <div className="mt-10"><LoadingBlock label="Carregando favoritos" /></div>}

      {!loading && items.length === 0 && (
        <div className="mt-10">
          <EmptyState
            title="Sua lista de favoritos está vazia"
            description="Toque no coração de um produto para guardá-lo aqui."
            action={<Button as={Link} to="/produtos" variant="tag">Explorar coleção</Button>}
          />
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <ProductCard key={item.id} product={item.product} />
          ))}
        </div>
      )}
    </div>
  );
}
