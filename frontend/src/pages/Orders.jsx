import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import ProductMedia from '../components/ProductMedia';
import { LoadingBlock, EmptyState } from '../components/States';
import Button from '../components/Button';
import { formatPrice, formatDate, STATUS_LABELS, STATUS_COLORS } from '../lib/format';

const IN_PROGRESS = ['aguardando_pagamento', 'pago', 'em_separacao', 'enviado'];
const DONE = ['entregue', 'cancelado', 'reembolsado'];

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState('todos');

  useEffect(() => {
    api.get('/orders').then(setOrders).catch(() => setOrders([]));
  }, []);

  const filtered = useMemo(() => {
    if (!orders) return [];
    if (filter === 'andamento') return orders.filter((o) => IN_PROGRESS.includes(o.status));
    if (filter === 'concluidos') return orders.filter((o) => DONE.includes(o.status));
    return orders;
  }, [orders, filter]);

  if (orders === null) return <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8"><LoadingBlock label="Carregando pedidos" /></div>;

  const countAndamento = orders.filter((o) => IN_PROGRESS.includes(o.status)).length;
  const countConcluidos = orders.filter((o) => DONE.includes(o.status)).length;

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-ink pb-4">
        <h1 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">Meus pedidos</h1>
        <div className="flex flex-wrap gap-2">
          {[
            ['todos', `Todos (${orders.length})`],
            ['andamento', `Em andamento (${countAndamento})`],
            ['concluidos', `Concluídos (${countConcluidos})`],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wide transition-colors ${
                filter === value ? 'bg-ink text-white' : 'bg-canvas-alt text-ink-soft hover:bg-line'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {orders.length === 0 && (
        <div className="mt-10">
          <EmptyState title="Nenhum pedido ainda" description="Seus pedidos aparecem aqui assim que você finalizar uma compra." action={<Button as={Link} to="/produtos" variant="tag">Ver produtos</Button>} />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-5">
        {filtered.map((order) => (
          <div key={order.id} className="overflow-hidden rounded-lg border border-line transition-colors hover:border-ink">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-canvas-alt px-5 py-3.5">
              <div className="flex flex-wrap items-center gap-5">
                <span className="text-sm font-black">PEDIDO #{order.orderNumber}</span>
                <span className="text-xs font-semibold text-ink-soft">Realizado em {formatDate(order.createdAt)}</span>
              </div>
              <span className={`rounded-full border px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wide ${STATUS_COLORS[order.status]}`}>
                {STATUS_LABELS[order.status]}
              </span>
            </div>

            <div className="flex flex-col gap-4 p-5">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="h-[75px] w-[60px] shrink-0 overflow-hidden rounded-md bg-canvas">
                      <ProductMedia product={item.variant?.product} color={item.variant?.color} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase">{item.variant?.product?.name || 'Produto'}</h4>
                      <p className="mt-1 text-[11px] font-semibold text-ink-soft">
                        Tamanho: <strong className="text-ink">{item.variant?.size}</strong> · Cor: <strong className="text-ink">{item.variant?.color}</strong> · Qtd: <strong className="text-ink">{item.quantity}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="whitespace-nowrap text-sm font-black">{formatPrice(item.unitPrice * item.quantity)}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line px-5 py-3.5">
              <p className="text-xs text-ink-soft">Total do pedido: <strong className="text-sm text-ink">{formatPrice(order.total)}</strong></p>
              <Button as={Link} to={`/minha-conta/pedidos/${order.id}`} size="sm">Ver detalhes</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
