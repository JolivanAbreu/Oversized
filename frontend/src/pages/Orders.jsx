import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { LoadingBlock, EmptyState } from '../components/States';
import Button from '../components/Button';
import { formatPrice, formatDate, STATUS_LABELS, STATUS_COLORS } from '../lib/format';

export default function Orders() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api.get('/orders').then(setOrders).catch(() => setOrders([]));
  }, []);

  if (orders === null) return <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8"><LoadingBlock label="Carregando pedidos" /></div>;

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-5xl">Meus pedidos</h1>

      {orders.length === 0 && (
        <div className="mt-10">
          <EmptyState title="Nenhum pedido ainda" description="Seus pedidos aparecem aqui assim que você finalizar uma compra." action={<Button as={Link} to="/produtos" variant="tag">Ver produtos</Button>} />
        </div>
      )}

      <div className="mt-8 space-y-4">
        {orders.map((order) => (
          <Link key={order.id} to={`/minha-conta/pedidos/${order.id}`} className="flex items-center justify-between border-2 border-ink p-5 hover:bg-canvas-alt">
            <div>
              <p className="font-display text-xl leading-none">{order.orderNumber}</p>
              <p className="mt-1 font-mono text-xs text-ink-soft">{formatDate(order.createdAt)}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`border-2 border-ink px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${STATUS_COLORS[order.status]}`}>
                {STATUS_LABELS[order.status]}
              </span>
              <span className="font-mono text-sm">{formatPrice(order.total)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
