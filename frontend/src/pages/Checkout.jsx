import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useCart } from '../context/CartContext';
import Field, { inputClass } from '../components/Field';
import Button from '../components/Button';
import Tag from '../components/Tag';
import { ErrorNotice, LoadingBlock } from '../components/States';
import { formatPrice } from '../lib/format';
import { isCardPaymentConfigured, tokenizeCard } from '../lib/mercadopago';
import { maskCEP, maskUF, maskCardNumber, maskExpirationMonth, maskExpirationYear, maskCVV, maskCPF } from '../lib/masks';
import { useCepAutofill } from '../lib/useCepAutofill';

const STEPS = ['Endereço', 'Frete', 'Pagamento'];

export default function Checkout() {
  const { cart, refresh } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [newAddress, setNewAddress] = useState({ street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip: '' });
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const { handleCepChange, loadingCep, cepNotFound } = useCepAutofill(setNewAddress);

  const [shippingOptions, setShippingOptions] = useState(null);
  const [selectedShipping, setSelectedShipping] = useState(null);

  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [couponError, setCouponError] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [card, setCard] = useState({ cardNumber: '', cardholderName: '', expirationMonth: '', expirationYear: '', securityCode: '', identificationNumber: '', installments: 1 });

  const [order, setOrder] = useState(null);
  const [pixData, setPixData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/addresses').then((data) => {
      setAddresses(data);
      const defaultAddr = data.find((a) => a.isDefault) || data[0];
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      else setShowNewAddressForm(true);
    });
  }, []);

  async function handleCreateAddress(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const created = await api.post('/addresses', { ...newAddress, isDefault: true });
      setAddresses((prev) => [...(prev || []), created]);
      setSelectedAddressId(created.id);
      setShowNewAddressForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar o endereço.');
    } finally {
      setLoading(false);
    }
  }

  async function goToShipping() {
    if (!selectedAddressId) {
      setError('Selecione ou cadastre um endereço.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const address = addresses.find((a) => a.id === selectedAddressId);
      const options = await api.post('/cart/shipping-quote', { zip: address.zip });
      setShippingOptions(options);
      setSelectedShipping(options[0]?.id || null);
      setStep(1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível calcular o frete.');
    } finally {
      setLoading(false);
    }
  }

  async function applyCoupon() {
    setCouponError('');
    if (!couponCode) return;
    try {
      const result = await api.post('/coupons/validate', { code: couponCode });
      setCouponResult(result);
    } catch (err) {
      setCouponResult(null);
      setCouponError(err instanceof ApiError ? err.message : 'Cupom inválido.');
    }
  }

  async function goToPayment() {
    setError('');
    setLoading(true);
    try {
      const created = await api.post('/orders', {
        address_id: selectedAddressId,
        shipping_option_id: selectedShipping,
        coupon_code: couponResult ? couponCode : undefined,
      });
      setOrder(created);
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar o pedido.');
    } finally {
      setLoading(false);
    }
  }

  async function payWithPix() {
    setError('');
    setLoading(true);
    try {
      const result = await api.post('/payments/pix', { order_id: order.id });
      setPixData(result);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível gerar o Pix.');
    } finally {
      setLoading(false);
    }
  }

  async function payWithCard(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cardToken = await tokenizeCard(card);
      await api.post('/payments/card', { order_id: order.id, card_token: cardToken, installments: Number(card.installments) });
      refresh();
      navigate(`/minha-conta/pedidos/${order.id}`, { state: { justPaid: true } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err.message || 'Pagamento não autorizado.');
    } finally {
      setLoading(false);
    }
  }

  const shippingCost = shippingOptions?.find((o) => o.id === selectedShipping)?.price || 0;
  const discount = couponResult?.discount || 0;
  const total = cart.subtotal - discount + shippingCost;

  if (addresses === null) return <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8"><LoadingBlock label="Carregando checkout" /></div>;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-5xl">Checkout</h1>

      <div className="mt-6 flex gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className={`flex-1 border-t-4 pt-2 font-mono text-xs uppercase tracking-widest ${i <= step ? 'border-tag text-ink' : 'border-line text-ink-soft'}`}>
            {i + 1}. {label}
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          {step === 0 && (
            <div className="space-y-6">
              {addresses.length > 0 && !showNewAddressForm && (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label key={addr.id} className={`block cursor-pointer border-2 p-4 ${selectedAddressId === addr.id ? 'border-ink' : 'border-line'}`}>
                      <input type="radio" name="address" className="mr-2" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} />
                      <span className="font-mono text-sm">{addr.street}, {addr.number} — {addr.neighborhood}, {addr.city}/{addr.state} · {addr.zip}</span>
                    </label>
                  ))}
                  <button onClick={() => setShowNewAddressForm(true)} className="font-mono text-xs uppercase underline decoration-dotted hover:text-tag">
                    + cadastrar novo endereço
                  </button>
                </div>
              )}

              {showNewAddressForm && (
                <form onSubmit={handleCreateAddress} className="space-y-4 border-2 border-ink p-5">
                  <Field label="CEP" hint={loadingCep ? 'Buscando endereço...' : cepNotFound ? 'CEP não encontrado — preencha manualmente' : 'Digite o CEP para preencher o resto automaticamente'}>
                    <input required className={inputClass} value={newAddress.zip} onChange={(e) => handleCepChange(maskCEP(e.target.value))} placeholder="00000-000" />
                  </Field>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <Field label="Rua"><input required className={inputClass} value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} /></Field>
                    </div>
                    <Field label="Número"><input required className={inputClass} value={newAddress.number} onChange={(e) => setNewAddress({ ...newAddress, number: e.target.value })} /></Field>
                  </div>
                  <Field label="Complemento (opcional)"><input className={inputClass} value={newAddress.complement} onChange={(e) => setNewAddress({ ...newAddress, complement: e.target.value })} /></Field>
                  <Field label="Bairro"><input required className={inputClass} value={newAddress.neighborhood} onChange={(e) => setNewAddress({ ...newAddress, neighborhood: e.target.value })} /></Field>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <Field label="Cidade"><input required className={inputClass} value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} /></Field>
                    </div>
                    <Field label="UF"><input required maxLength={2} className={inputClass} value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: maskUF(e.target.value) })} /></Field>
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" variant="tag" disabled={loading}>Salvar endereço</Button>
                    {addresses.length > 0 && (
                      <Button type="button" variant="ghost" onClick={() => setShowNewAddressForm(false)}>Cancelar</Button>
                    )}
                  </div>
                </form>
              )}

              <ErrorNotice message={error} />
              {!showNewAddressForm && (
                <Button variant="tag" size="lg" onClick={goToShipping} disabled={loading}>
                  {loading ? 'Calculando frete...' : 'Continuar para o frete →'}
                </Button>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-3">
                {shippingOptions?.map((option) => (
                  <label key={option.id} className={`flex cursor-pointer items-center justify-between border-2 p-4 ${selectedShipping === option.id ? 'border-ink' : 'border-line'}`}>
                    <span className="flex items-center gap-3">
                      <input type="radio" name="shipping" checked={selectedShipping === option.id} onChange={() => setSelectedShipping(option.id)} />
                      <span>
                        <span className="block font-display text-lg leading-none">{option.name}</span>
                        <span className="font-mono text-xs text-ink-soft">até {option.estimatedDays} dias úteis</span>
                      </span>
                    </span>
                    <span className="font-mono text-sm">{formatPrice(option.price)}</span>
                  </label>
                ))}
              </div>

              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">Cupom de desconto</p>
                <div className="mt-2 flex gap-2">
                  <input
                    className={inputClass}
                    placeholder="BEMVINDA10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  />
                  <Button type="button" variant="secondary" onClick={applyCoupon}>Aplicar</Button>
                </div>
                {couponResult && <p className="mt-2 font-mono text-xs text-tag">cupom aplicado: −{formatPrice(couponResult.discount)}</p>}
                {couponError && <p className="mt-2 font-mono text-xs text-danger">{couponError}</p>}
              </div>

              <ErrorNotice message={error} />
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(0)}>← Voltar</Button>
                <Button variant="tag" size="lg" onClick={goToPayment} disabled={loading || !selectedShipping}>
                  {loading ? 'Criando pedido...' : 'Continuar para o pagamento →'}
                </Button>
              </div>
            </div>
          )}

          {step === 2 && order && (
            <div className="space-y-6">
              <Tag variant="lime">pedido {order.orderNumber} criado — aguardando pagamento</Tag>

              <div className="flex gap-2 border-b-2 border-ink pb-4">
                <button onClick={() => setPaymentMethod('pix')} className={`border-2 px-4 py-2 font-mono text-xs uppercase ${paymentMethod === 'pix' ? 'border-ink bg-ink text-white' : 'border-line'}`}>Pix</button>
                <button onClick={() => setPaymentMethod('card')} className={`border-2 px-4 py-2 font-mono text-xs uppercase ${paymentMethod === 'card' ? 'border-ink bg-ink text-white' : 'border-line'}`}>Cartão de crédito</button>
              </div>

              {paymentMethod === 'pix' && (
                <div className="space-y-4">
                  {!pixData && (
                    <Button variant="tag" size="lg" onClick={payWithPix} disabled={loading}>
                      {loading ? 'Gerando Pix...' : 'Gerar QR Code Pix'}
                    </Button>
                  )}
                  {pixData && (
                    <div className="border-2 border-ink p-6 text-center">
                      <p className="font-mono text-xs uppercase text-ink-soft">Escaneie ou copie o código abaixo</p>
                      {pixData.qr_code_base64 && (
                        <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Code Pix" className="mx-auto mt-4 h-48 w-48" />
                      )}
                      <textarea readOnly className="mt-4 w-full border-2 border-line bg-canvas-alt p-2 font-mono text-xs" rows={3} value={pixData.copy_paste_code || ''} />
                      <p className="mt-3 font-mono text-xs text-ink-soft">expira às {new Date(pixData.expires_at).toLocaleTimeString('pt-BR')}</p>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'card' && (
                <form onSubmit={payWithCard} className="space-y-4">
                  {!isCardPaymentConfigured() && (
                    <ErrorNotice message="Pagamento por cartão requer a chave pública de sandbox do Mercado Pago (VITE_MERCADOPAGO_PUBLIC_KEY). Use Pix para testar o fluxo completo." />
                  )}
                  <Field label="Número do cartão">
                    <input required inputMode="numeric" placeholder="0000 0000 0000 0000" className={inputClass} value={card.cardNumber} onChange={(e) => setCard({ ...card, cardNumber: maskCardNumber(e.target.value) })} />
                  </Field>
                  <Field label="Nome impresso no cartão">
                    <input required className={inputClass} value={card.cardholderName} onChange={(e) => setCard({ ...card, cardholderName: e.target.value.toUpperCase() })} />
                  </Field>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Mês"><input required inputMode="numeric" placeholder="MM" className={inputClass} value={card.expirationMonth} onChange={(e) => setCard({ ...card, expirationMonth: maskExpirationMonth(e.target.value) })} /></Field>
                    <Field label="Ano"><input required inputMode="numeric" placeholder="AAAA" className={inputClass} value={card.expirationYear} onChange={(e) => setCard({ ...card, expirationYear: maskExpirationYear(e.target.value) })} /></Field>
                    <Field label="CVV"><input required inputMode="numeric" placeholder="000" className={inputClass} value={card.securityCode} onChange={(e) => setCard({ ...card, securityCode: maskCVV(e.target.value) })} /></Field>
                  </div>
                  <Field label="CPF do titular">
                    <input required inputMode="numeric" placeholder="000.000.000-00" className={inputClass} value={card.identificationNumber} onChange={(e) => setCard({ ...card, identificationNumber: maskCPF(e.target.value) })} />
                  </Field>
                  <Field label="Parcelas">
                    <select className={inputClass} value={card.installments} onChange={(e) => setCard({ ...card, installments: e.target.value })}>
                      {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}x</option>)}
                    </select>
                  </Field>
                  <ErrorNotice message={error} />
                  <Button type="submit" variant="tag" size="lg" disabled={loading || !isCardPaymentConfigured()}>
                    {loading ? 'Processando...' : `Pagar ${formatPrice(total)}`}
                  </Button>
                </form>
              )}

              <ErrorNotice message={paymentMethod === 'pix' ? error : ''} />
            </div>
          )}
        </div>

        <aside className="h-fit border-2 border-ink p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">Resumo</p>
          <div className="mt-3 space-y-2 font-mono text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(cart.subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-tag"><span>Desconto</span><span>−{formatPrice(discount)}</span></div>}
            <div className="flex justify-between"><span>Frete</span><span>{shippingCost ? formatPrice(shippingCost) : '—'}</span></div>
            <div className="flex justify-between border-t-2 border-ink pt-2 text-base font-bold"><span>Total</span><span>{formatPrice(total)}</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
