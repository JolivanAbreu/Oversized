import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import PaymentPanel from '../components/PaymentPanel';
import Tag from '../components/Tag';
import { LoadingBlock, EmptyState } from '../components/States';
import { formatPrice } from '../lib/format';

export default function ResumePayment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refresh } = useCart();
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/orders/${id}`).then(setOrder).catch(() => setNotFound(true));
  }, [id]);

  function handlePaid() {
    refresh();
    navigate(`/minha-conta/pedidos/${id}`, { state: { justPaid: true } });
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
        <EmptyState title="Pedido não encontrado" description="Esse pedido não existe ou não pertence à sua conta." />
      </div>
    );
  }

  if (!order) return <div className="mx-auto max-w-2xl px-5 py-16 sm:px-8"><LoadingBlock label="Carregando pedido" /></div>;

  if (order.status !== 'aguardando_pagamento') {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
        <EmptyState
          title="Este pedido já foi processado"
          description="Não há pagamento pendente aqui — confira o status atual na página do pedido."
          action={<Link to={`/minha-conta/pedidos/${id}`} className="font-mono text-xs uppercase underline decoration-dotted hover:text-tag">Ver pedido</Link>}
        />
      </div>
    );
  }

  const latestPayment = order.payments?.[0];
  const stillValidPixPending = latestPayment?.method === 'pix' && latestPayment.status === 'pending' && new Date(latestPayment.pixExpiration) > new Date();

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-5xl">Continuar pagamento</h1>
      <div className="mt-4">
        <Tag variant="lime">pedido {order.orderNumber} · total {formatPrice(order.total)}</Tag>
      </div>

      <div className="mt-8">
        <PaymentPanel
          order={order}
          total={order.total}
          existingPayment={stillValidPixPending ? latestPayment : null}
          onPaid={handlePaid}
        />
      </div>
    </div>
  );
}
