import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { LoadingBlock } from '../components/States';
import Tag from '../components/Tag';
import { formatPrice, formatDate, STATUS_LABELS, STATUS_COLORS } from '../lib/format';

const TIMELINE = ['aguardando_pagamento', 'pago', 'em_separacao', 'enviado', 'entregue'];

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then(setOrder);
  }, [id]);

  if (!order) return <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8"><LoadingBlock label="Carregando pedido" /></div>;

  const currentIndex = TIMELINE.indexOf(order.status);
  const isTerminalBad = ['cancelado', 'reembolsado'].includes(order.status);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      {location.state?.justPaid && (
        <div className="mb-6 border-2 border-ink bg-lime px-4 py-3 font-mono text-xs uppercase tracking-widest">
          Pagamento confirmado — obrigado pela compra!
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-4xl leading-none">{order.orderNumber}</h1>
          <p className="mt-1 font-mono text-xs text-ink-soft">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`border-2 border-ink px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${STATUS_COLORS[order.status]}`}>
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      {!isTerminalBad && (
        <div className="mt-8 flex items-center gap-1">
          {TIMELINE.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 ${i <= currentIndex ? 'bg-tag' : 'bg-line'}`} />
          ))}
        </div>
      )}
      {!isTerminalBad && (
        <div className="mt-2 flex justify-between font-mono text-[10px] uppercase text-ink-soft">
          {TIMELINE.map((s) => <span key={s}>{STATUS_LABELS[s].split(' ')[0]}</span>)}
        </div>
      )}

      {order.trackingCode && (
        <div className="mt-6">
          <Tag variant="lime">rastreio: {order.trackingCode}</Tag>
        </div>
      )}

      <div className="mt-10 divide-y-2 divide-line border-y-2 border-ink">
        {order.items?.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-4">
            <div>
              <p className="font-display text-lg leading-none">{item.variant?.product?.name || 'Produto'}</p>
              <p className="mt-1 font-mono text-xs uppercase text-ink-soft">
                {item.variant?.size} · {item.variant?.color} · qtd {item.quantity}
              </p>
            </div>
            <p className="font-mono text-sm">{formatPrice(item.unitPrice * item.quantity)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <div className="w-56 space-y-1 font-mono text-sm">
          <div className="flex justify-between"><span className="text-ink-soft">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          {Number(order.discount) > 0 && <div className="flex justify-between text-tag"><span>Desconto</span><span>−{formatPrice(order.discount)}</span></div>}
          <div className="flex justify-between"><span className="text-ink-soft">Frete</span><span>{formatPrice(order.shippingCost)}</span></div>
          <div className="flex justify-between border-t-2 border-ink pt-1 text-base font-bold"><span>Total</span><span>{formatPrice(order.total)}</span></div>
        </div>
      </div>

      {order.address && (
        <div className="mt-8 border-2 border-line p-4 font-mono text-xs text-ink-soft">
          <p className="uppercase text-ink">Endereço de entrega</p>
          <p className="mt-1">{order.address.street}, {order.address.number} — {order.address.neighborhood}, {order.address.city}/{order.address.state} · {order.address.zip}</p>
        </div>
      )}
    </div>
  );
}
