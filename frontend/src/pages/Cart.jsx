import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { api, ApiError } from '../api/client';
import ProductMedia from '../components/ProductMedia';
import Button from '../components/Button';
import { EmptyState } from '../components/States';
import { formatPrice } from '../lib/format';

export default function Cart() {
  const { cart, updateItem, removeItem, coupon, setCoupon } = useCart();
  const { isAuthenticated } = useAuth();
  const { openLoginModal } = useAuthModal();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState(null); // { ok: bool, text: string }
  const [applying, setApplying] = useState(false);

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
      openLoginModal('/checkout');
      return;
    }
    navigate('/checkout');
  }

  async function handleApplyCoupon(e) {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponMsg({ ok: false, text: 'Digite um cupom.' });
      return;
    }
    setApplying(true);
    setCouponMsg(null);
    try {
      const result = await api.post('/coupons/validate', { code });
      setCoupon({ code, discount: result.discount });
      setCouponMsg({ ok: true, text: `Cupom ${code} aplicado — desconto de ${formatPrice(result.discount)}.` });
    } catch (err) {
      setCoupon(null);
      setCouponMsg({ ok: false, text: err instanceof ApiError ? err.message : 'Cupom inválido ou expirado.' });
    } finally {
      setApplying(false);
    }
  }

  const discount = coupon?.discount || 0;
  const total = Math.max(0, cart.subtotal - discount);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <div className="flex items-center justify-between border-b-2 border-ink pb-4">
        <h1 className="font-display text-3xl sm:text-4xl">
          Minha sacola <span className="text-base font-normal text-ink-soft">({cart.items.length} {cart.items.length === 1 ? 'item' : 'itens'})</span>
        </h1>
        <Link to="/produtos" className="hidden font-mono text-xs uppercase tracking-widest text-ink-soft underline decoration-dotted hover:text-tag sm:block">
          ← Continuar comprando
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="flex flex-col gap-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-line bg-canvas-alt p-4">
                <div className="h-[90px] w-[70px] shrink-0 overflow-hidden rounded-md bg-canvas">
                  <ProductMedia product={item.variant.product} color={item.variant.color} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-[180px] flex-1">
                  <h3 className="text-sm font-black uppercase">{item.variant.product.name}</h3>
                  <p className="mt-1 text-xs text-ink-soft">Tamanho: <strong className="text-ink">{item.variant.size}</strong> · Cor: <strong className="text-ink">{item.variant.color}</strong></p>
                  <p className="mt-1 text-sm font-black">{formatPrice(item.lineTotal)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center overflow-hidden rounded-md border border-line bg-canvas">
                    <button
                      className="flex h-8 w-8 items-center justify-center font-bold hover:bg-line disabled:opacity-30"
                      disabled={item.quantity <= 1}
                      onClick={() => updateItem(item.id, item.quantity - 1)}
                      aria-label="Diminuir quantidade"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      className="flex h-8 w-8 items-center justify-center font-bold hover:bg-line"
                      onClick={() => updateItem(item.id, item.quantity + 1)}
                      aria-label="Aumentar quantidade"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label="Remover item"
                    className="text-lg text-danger transition-transform hover:scale-110"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-line bg-canvas-alt p-4">
            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wide">Cupom de desconto</h4>
            <form onSubmit={handleApplyCoupon} className="mt-3 flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Ex: BEMVINDA10"
                className="flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm uppercase text-ink outline-none focus:border-ink"
              />
              <Button type="submit" disabled={applying}>{applying ? 'Aplicando...' : 'Aplicar'}</Button>
            </form>
            {couponMsg && (
              <p className={`mt-2 text-xs font-bold ${couponMsg.ok ? 'text-tag-dark' : 'text-danger'}`}>{couponMsg.text}</p>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-line bg-canvas-alt p-5 lg:sticky lg:top-24">
          <h2 className="border-b-2 border-ink pb-3 text-sm font-black uppercase tracking-wide">Resumo do pedido</h2>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>Subtotal</span>
              <span>{formatPrice(cart.subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-danger">
                <span>Desconto</span>
                <span>− {formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-ink-soft">
              <span>Frete</span>
              <span>calculado no checkout</span>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-black">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <Button variant="tag" size="lg" onClick={goToCheckout} className="mt-5 w-full justify-center">
            Finalizar compra
          </Button>
          <Button as={Link} to="/produtos" variant="secondary" className="mt-2 w-full justify-center">
            Adicionar mais produtos
          </Button>
        </aside>
      </div>
    </div>
  );
}
