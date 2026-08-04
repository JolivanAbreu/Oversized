import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import GarmentArt from '../components/GarmentArt';
import Button from '../components/Button';
import { EmptyState } from '../components/States';
import { formatPrice } from '../lib/format';

export default function Cart() {
  const { cart, updateItem, removeItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <EmptyState
          title="Sacola vazia"
          description="Ainda não tem nada por aqui. Que tal dar uma olhada na loja?"
          action={<Button as={Link} to="/produtos" variant="tag">Ver produtos</Button>}
        />
      </div>
    );
  }

  function goToCheckout() {
    if (!isAuthenticated) {
      navigate('/entrar', { state: { redirectTo: '/checkout' } });
      return;
    }
    navigate('/checkout');
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-5xl">Sacola</h1>

      <div className="mt-8 divide-y-2 divide-line border-y-2 border-ink">
        {cart.items.map((item) => (
          <div key={item.id} className="flex gap-4 py-5">
            <div className="h-24 w-20 shrink-0 border-2 border-ink bg-canvas-alt">
              <GarmentArt color={item.variant.color} className="h-full w-full" />
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-xl leading-none">{item.variant.product.name}</p>
                  <p className="mt-1 font-mono text-xs uppercase text-ink-soft">{item.variant.size} · {item.variant.color}</p>
                </div>
                <p className="font-mono text-sm">{formatPrice(item.lineTotal)}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center border-2 border-ink">
                  <button
                    className="px-3 py-1 font-mono hover:bg-canvas-alt disabled:opacity-30"
                    disabled={item.quantity <= 1}
                    onClick={() => updateItem(item.id, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span className="px-3 font-mono text-sm">{item.quantity}</span>
                  <button
                    className="px-3 py-1 font-mono hover:bg-canvas-alt"
                    onClick={() => updateItem(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="font-mono text-xs uppercase text-ink-soft underline decoration-dotted hover:text-danger"
                >
                  remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-end gap-4">
        <div className="text-right">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">Subtotal</p>
          <p className="font-display text-3xl">{formatPrice(cart.subtotal)}</p>
          <p className="mt-1 text-xs text-ink-soft">Frete calculado no próximo passo</p>
        </div>
        <Button variant="tag" size="lg" onClick={goToCheckout}>
          Finalizar compra →
        </Button>
      </div>
    </div>
  );
}
