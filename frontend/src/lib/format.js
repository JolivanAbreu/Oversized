export function formatPrice(value) {
  const number = Number(value || 0);
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const STATUS_LABELS = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  em_separacao: 'Em separação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
  reembolsado: 'Reembolsado',
};

export const STATUS_COLORS = {
  aguardando_pagamento: 'bg-canvas-alt text-ink',
  pago: 'bg-lime text-ink',
  em_separacao: 'bg-white text-ink',
  enviado: 'bg-white text-ink',
  entregue: 'bg-lime text-ink',
  cancelado: 'bg-danger text-white',
  reembolsado: 'bg-danger text-white',
};
