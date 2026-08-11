import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { LoadingBlock, ErrorNotice } from '../components/States';
import Button from '../components/Button';
import ProductMedia from '../components/ProductMedia';
import ShippingArrangementNotice from '../components/ShippingArrangementNotice';
import { formatPrice, formatDateTime, STATUS_LABELS, STATUS_COLORS } from '../lib/format';

const CANCELABLE = ['aguardando_pagamento', 'pago', 'em_separacao'];
const DELETABLE = ['aguardando_pagamento', 'cancelado'];

const TIMELINE_STEPS = [
  { key: 'realizado', label: 'Pedido realizado' },
  { key: 'pago', label: 'Pagamento aprovado' },
  { key: 'separacao', label: 'Em separação' },
  { key: 'transito', label: 'Em trânsito' },
  { key: 'entregue', label: 'Entregue' },
];

// A partir do status real do pedido, decide quantos passos da linha do
// tempo já foram completados e qual está "ativo" agora.
function timelineProgress(status) {
  const map = {
    aguardando_pagamento: 0,
    pago: 1,
    em_separacao: 2,
    enviado: 3,
    entregue: 4,
  };
  return map[status] ?? 0;
}

const PAYMENT_METHOD_LABELS = { pix: 'Pix (à vista)', card: 'Cartão de crédito' };

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  function load() {
    api.get(`/orders/${id}`).then(setOrder);
  }

  useEffect(load, [id]);

  async function handleCancel() {
    setError('');
    setBusy(true);
    try {
      await api.post(`/orders/${id}/cancel`);
      setConfirmingCancel(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível cancelar o pedido.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setError('');
    setBusy(true);
    try {
      await api.delete(`/orders/${id}`);
      navigate('/minha-conta/pedidos');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível excluir o pedido.');
      setBusy(false);
    }
  }

  function handleCopyTracking() {
    navigator.clipboard.writeText(order.trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!order) return <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8"><LoadingBlock label="Carregando pedido" /></div>;

  const isTerminalBad = ['cancelado', 'reembolsado'].includes(order.status);
  const canCancel = CANCELABLE.includes(order.status);
  const canDelete = DELETABLE.includes(order.status);
  const progress = timelineProgress(order.status);
  const lastPayment = order.payments?.[0];

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
      <button onClick={() => navigate('/minha-conta/pedidos')} className="mb-5 font-mono text-xs font-bold uppercase tracking-widest text-ink hover:opacity-70">
        ← Voltar para meus pedidos
      </button>

      {location.state?.justPaid && (
        <div className="mb-6 rounded-lg border border-tag-dark bg-lime px-4 py-3 text-sm font-bold">
          Pagamento confirmado — obrigado pela compra!
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-canvas-alt p-5">
        <div>
          <h2 className="text-lg font-black">PEDIDO #{order.orderNumber}</h2>
          <p className="mt-1 text-xs text-ink-soft">Realizado em {formatDateTime(order.createdAt)}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wide ${STATUS_COLORS[order.status]}`}>
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      {order.status === 'aguardando_pagamento' && (
        <div className="mt-5 rounded-lg border border-line bg-canvas-alt p-4">
          <p className="text-xs font-bold uppercase text-ink-soft">Este pedido ainda não foi pago</p>
          <Button as={Link} to={`/minha-conta/pedidos/${id}/pagamento`} variant="tag" size="sm" className="mt-3">
            Continuar pagamento →
          </Button>
        </div>
      )}

      {!isTerminalBad && (
        <div className="mt-6 rounded-lg border border-line p-6">
          <p className="text-xs font-black uppercase tracking-wide">Status do envio</p>

          <div className="relative mt-8 flex justify-between">
            <div className="absolute left-[10%] right-[10%] top-[19px] h-[3px] bg-line" />
            <div
              className="absolute left-[10%] top-[19px] h-[3px] bg-tag transition-all duration-500"
              style={{ width: `${Math.min(progress, 3) / 3 * 60}%` }}
            />
            {TIMELINE_STEPS.map((step, i) => (
              <div key={step.key} className="relative z-[2] flex w-1/5 flex-col items-center text-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-canvas-alt text-xs font-bold ${
                    i < progress ? 'bg-tag text-ink' : i === progress ? 'bg-ink text-white' : 'bg-line text-ink-soft'
                  }`}
                >
                  {i < progress ? '✓' : i + 1}
                </div>
                <p className="mt-2 text-[10px] font-black uppercase leading-tight">{step.label}</p>
              </div>
            ))}
          </div>

          {order.trackingCode && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-line bg-canvas-alt p-3">
              <div>
                <p className="text-[11px] font-bold uppercase text-ink-soft">Código de rastreio</p>
                <p className="font-mono text-sm font-bold">{order.trackingCode}</p>
              </div>
              <button onClick={handleCopyTracking} className="rounded-md border border-line bg-white px-3 py-1.5 text-[10px] font-black uppercase hover:border-ink">
                {copied ? 'copiado ✓' : 'copiar código'}
              </button>
            </div>
          )}
        </div>
      )}

      <ShippingArrangementNotice order={order} />

      <div className="mt-6 grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-lg border border-line p-5">
          <p className="border-b border-line pb-3 text-xs font-black uppercase tracking-wide">Produtos comprados</p>
          <div className="mt-4 flex flex-col gap-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-line p-3">
                <div className="flex items-center gap-3">
                  <div className="h-[70px] w-14 shrink-0 overflow-hidden rounded-md bg-canvas">
                    <ProductMedia product={item.variant?.product} color={item.variant?.color} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase">{item.variant?.product?.name || 'Produto'}</h4>
                    <p className="mt-1 text-[11px] text-ink-soft">Tamanho: <strong className="text-ink">{item.variant?.size}</strong> · Cor: <strong className="text-ink">{item.variant?.color}</strong></p>
                    <p className="text-[11px] text-ink-soft">Qtd: <strong className="text-ink">{item.quantity}x {formatPrice(item.unitPrice)}</strong></p>
                  </div>
                </div>
                <p className="whitespace-nowrap text-sm font-black">{formatPrice(item.unitPrice * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {order.address && (
            <div className="rounded-lg border border-line p-4">
              <p className="border-b border-line pb-2 text-xs font-black uppercase tracking-wide">Endereço de entrega</p>
              <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                <strong className="text-ink">{order.address.street}, {order.address.number}</strong>
                {order.address.complement && ` — ${order.address.complement}`}<br />
                {order.address.neighborhood} — {order.address.city}/{order.address.state}<br />
                CEP: {order.address.zip}
              </p>
            </div>
          )}

          <div className="rounded-lg border border-line p-4">
            <p className="border-b border-line pb-2 text-xs font-black uppercase tracking-wide">Pagamento e resumo</p>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between text-ink-soft"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              {Number(order.discount) > 0 && <div className="flex justify-between text-tag-dark"><span>Desconto</span><span>−{formatPrice(order.discount)}</span></div>}
              <div className="flex justify-between text-ink-soft">
                <span>Frete{order.shippingMethodName ? ` (${order.shippingMethodName})` : ''}</span>
                <span>{Number(order.shippingCost) > 0 ? formatPrice(order.shippingCost) : 'grátis'}</span>
              </div>
              {lastPayment && (
                <div className="flex justify-between text-ink-soft"><span>Forma de pagamento</span><span>{PAYMENT_METHOD_LABELS[lastPayment.method] || lastPayment.method}</span></div>
              )}
              <div className="flex justify-between border-t border-line pt-2 text-sm font-black"><span>Total {['pago', 'em_separacao', 'enviado', 'entregue'].includes(order.status) ? 'pago' : ''}</span><span>{formatPrice(order.total)}</span></div>
            </div>
          </div>
        </div>
      </div>

      <ErrorNotice message={error} />

      {(canCancel || canDelete) && (
        <div className="mt-8 space-y-4 border-t border-line pt-6">
          {canCancel && (
            <div>
              {!confirmingCancel ? (
                <button onClick={() => setConfirmingCancel(true)} className="font-mono text-xs uppercase text-ink-soft underline decoration-dotted hover:text-danger">
                  Cancelar pedido
                </button>
              ) : (
                <div className="rounded-lg border border-danger p-4">
                  <p className="text-sm">Tem certeza que quer cancelar este pedido?</p>
                  {['pago', 'em_separacao'].includes(order.status) && (
                    <p className="mt-1 text-xs text-ink-soft">Como o pedido já foi pago, o estorno será solicitado automaticamente.</p>
                  )}
                  <div className="mt-3 flex gap-3">
                    <Button variant="tag" size="sm" onClick={handleCancel} disabled={busy}>{busy ? 'Cancelando...' : 'Sim, cancelar'}</Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmingCancel(false)}>Voltar</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {canDelete && (
            <div>
              {!confirmingDelete ? (
                <button onClick={() => setConfirmingDelete(true)} className="font-mono text-xs uppercase text-ink-soft underline decoration-dotted hover:text-danger">
                  Excluir pedido
                </button>
              ) : (
                <div className="rounded-lg border border-danger p-4">
                  <p className="text-sm">Excluir remove este pedido definitivamente do seu histórico. Não dá pra desfazer.</p>
                  <div className="mt-3 flex gap-3">
                    <Button variant="tag" size="sm" onClick={handleDelete} disabled={busy}>{busy ? 'Excluindo...' : 'Sim, excluir'}</Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>Voltar</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
