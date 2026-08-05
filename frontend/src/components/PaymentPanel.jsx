import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../api/client';
import Field, { inputClass } from './Field';
import Button from './Button';
import { ErrorNotice } from './States';
import { formatPrice } from '../lib/format';
import { isCardPaymentConfigured, tokenizeCard } from '../lib/mercadopago';
import { maskCardNumber, maskExpirationMonth, maskExpirationYear, maskCVV, maskCPF } from '../lib/masks';

const POLL_INTERVAL_MS = 4000;

/**
 * Painel de pagamento de um pedido existente (Pix ou cartão). Usado tanto no
 * checkout logo após criar o pedido quanto para retomar o pagamento de um
 * pedido já criado que ficou "aguardando_pagamento" (ex.: o cliente saiu da
 * tela antes de terminar, ou o pagamento anterior falhou).
 *
 * O Pix faz polling do status a cada poucos segundos — não depende do
 * webhook do Mercado Pago, que não funciona em ambiente local (ver
 * integrations/mercadopago.js no backend).
 */
export default function PaymentPanel({ order, total, existingPayment, onPaid }) {
  const [paymentMethod, setPaymentMethod] = useState(existingPayment?.method || 'pix');
  const [card, setCard] = useState({ cardNumber: '', cardholderName: '', expirationMonth: '', expirationYear: '', securityCode: '', identificationNumber: '', installments: 1 });
  const [pixData, setPixData] = useState(
    existingPayment?.method === 'pix' && existingPayment.status === 'pending'
      ? { payment_id: existingPayment.id, qr_code_base64: existingPayment.pixQrCode, copy_paste_code: existingPayment.pixCopyPaste, expires_at: existingPayment.pixExpiration }
      : null
  );
  const [pixStatus, setPixStatus] = useState(existingPayment?.status === 'pending' ? 'pending' : null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  function startPolling(paymentId) {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const status = await api.get(`/payments/${paymentId}/status`);
        setPixStatus(status.status);
        if (status.status === 'approved') {
          clearInterval(pollRef.current);
          onPaid();
        } else if (['rejected', 'refunded'].includes(status.status)) {
          clearInterval(pollRef.current);
        }
      } catch (err) {
        // falha pontual de rede na consulta não deve interromper o polling
      }
    }, POLL_INTERVAL_MS);
  }

  useEffect(() => {
    if (pixData && pixStatus === 'pending') {
      startPolling(pixData.payment_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pixData]);

  async function payWithPix() {
    setError('');
    setLoading(true);
    try {
      const result = await api.post('/payments/pix', { order_id: order.id });
      setPixData(result);
      setPixStatus('pending');
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
      onPaid();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err.message || 'Pagamento não autorizado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
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
              {pixData.expires_at && (
                <p className="mt-3 font-mono text-xs text-ink-soft">expira às {new Date(pixData.expires_at).toLocaleTimeString('pt-BR')}</p>
              )}
              <div className="mt-4 flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-soft">
                <span className="h-2 w-2 animate-ping rounded-full bg-tag" />
                {pixStatus === 'rejected' ? 'Pagamento não aprovado' : pixStatus === 'refunded' ? 'Pagamento reembolsado' : 'Aguardando confirmação do pagamento...'}
              </div>
            </div>
          )}
          <ErrorNotice message={error} />
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
    </div>
  );
}
