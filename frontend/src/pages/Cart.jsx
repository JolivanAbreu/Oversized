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
      <div className="mx-auto max-w-7xl px-2.5 py-4 sm:px-4">
        <EmptyState
          title="Sua sacola está vazia"
          description="Navegue pela loja e adicione produtos incríveis!"
          icon="🛍"
          action={<Button as={Link} to="/produtos" variant="tag">Ir para a loja</Button>}
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
    <div className="mx-auto max-w-7xl px-2.5 py-4 sm:px-4">
      <div className="rounded-lg bg-white p-6 shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-4">
          <h1 className="flex flex-wrap items-center gap-2.5 text-[22px] font-black uppercase text-[#111111]">
            Minha Sacola <span className="text-sm font-bold text-ink-soft">({cart.items.length} {cart.items.length === 1 ? 'item' : 'itens'})</span>
          </h1>
          <Link
            to="/produtos"
            className="inline-flex items-center gap-2 rounded border border-[#cccccc] px-4 py-2.5 font-mono text-[11px] font-black uppercase text-[#333333] transition-colors hover:border-[#111111] hover:bg-[#f8f8f8]"
          >
            ← Continuar a comprar
          </Link>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div>
            <div className="flex flex-col gap-3.5">
              {cart.items.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line p-3.5">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded bg-canvas">
                      <ProductMedia product={item.variant.product} color={item.variant.color} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase leading-snug text-[#111111]">{item.variant.product.name}</h3>
                      <p className="mt-1 text-[11px] font-semibold text-ink-soft">Tamanho: <strong className="text-[#111111]">{item.variant.size}</strong> · Cor: <strong className="text-[#111111]">{item.variant.color}</strong></p>
                      <p className="mt-1.5 text-[13px] font-black text-[#111111]">{formatPrice(item.lineTotal)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-2.5 rounded-[20px] bg-canvas p-1">
                      <button
                        className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white text-sm font-black text-[#111111] shadow-[0_1px_3px_rgba(0,0,0,0.15)] hover:bg-tag disabled:opacity-30"
                        disabled={item.quantity <= 1}
                        onClick={() => updateItem(item.id, item.quantity - 1)}
                        aria-label="Diminuir quantidade"
                      >
                        −
                      </button>
                      <span className="min-w-[16px] text-center text-xs font-black">{item.quantity}</span>
                      <button
                        className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white text-sm font-black text-[#111111] shadow-[0_1px_3px_rgba(0,0,0,0.15)] hover:bg-tag"
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        aria-label="Aumentar quantidade"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      aria-label="Remover item"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[15px] text-danger transition-colors hover:bg-danger/10"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-line bg-[#fafafa] p-4">
                <h4 className="flex items-center gap-2 text-xs font-black uppercase text-[#111111]">🎟 Cupom de Desconto</h4>
                <form onSubmit={handleApplyCoupon} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Ex: DRAVENNX10"
                    className="min-w-0 flex-1 rounded border border-[#cccccc] px-3 py-2.5 text-xs uppercase text-[#111111] outline-none focus:border-[#111111]"
                  />
                  <button type="submit" disabled={applying} className="whitespace-nowrap rounded bg-[#111111] px-4 font-mono text-[11px] font-black uppercase text-white transition-colors hover:bg-black disabled:opacity-60">
                    {applying ? '...' : 'Aplicar'}
                  </button>
                </form>
                {couponMsg && (
                  <p className={`mt-1.5 text-[10px] font-bold ${couponMsg.ok ? 'text-tag-dark' : 'text-danger'}`}>{couponMsg.text}</p>
                )}
              </div>

              <div className="rounded-lg border border-line bg-[#fafafa] p-4">
                <h4 className="flex items-center gap-2 text-xs font-black uppercase text-[#111111]">🚚 Frete</h4>
                <p className="mt-3 text-[10px] font-bold leading-relaxed text-ink-soft">
                  O frete (Uber Flash, 99 ou combinar com a loja) é escolhido na hora de fechar o pedido, no checkout.
                </p>
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-lg border border-line bg-[#fafafa] p-5 lg:sticky lg:top-24">
            <h2 className="border-b-2 border-ink pb-3 text-sm font-black uppercase text-[#111111]">Resumo do Pedido</h2>

            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between py-2 text-xs text-[#333333]">
                <span>Subtotal</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between py-2 text-xs text-danger">
                  <span>Desconto</span>
                  <span>− {formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 text-xs text-[#333333]">
                <span>Frete</span>
                <span className="font-bold text-tag-dark">calculado no checkout</span>
              </div>
              <div className="flex items-end justify-between border-t border-dashed border-line pt-3.5 text-[13px] font-black uppercase text-[#111111]">
                <span>Total</span>
                <span className="text-lg font-black">{formatPrice(total)}</span>
              </div>
            </div>

            <button
              onClick={goToCheckout}
              className="mt-4.5 flex w-full items-center justify-center gap-2 rounded border-[1.5px] border-[#111111] bg-tag py-3.5 text-[13px] font-black uppercase tracking-wide text-[#111111] shadow-[3px_3px_0px_#111111] transition-all hover:bg-[#00e066] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#111111]"
            >
              🔒 Finalizar Compra
            </button>
            <Link
              to="/produtos"
              className="mt-2.5 flex w-full items-center justify-center gap-2 rounded border border-[#cccccc] py-2.5 font-mono text-[11px] font-black uppercase text-[#333333] transition-colors hover:border-[#111111] hover:bg-[#f8f8f8]"
            >
              Adicionar mais produtos
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
