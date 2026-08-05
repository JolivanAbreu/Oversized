const { sendMail } = require('../integrations/mailer');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

async function sendEmailConfirmation(user, token) {
  const link = `${FRONTEND_URL}/confirmar-email?token=${token}`;
  await sendMail({
    to: user.email,
    subject: 'Confirme seu e-mail — Dravennx',
    html: `<p>Olá, ${user.name}!</p><p>Confirme seu e-mail clicando no link abaixo:</p><p><a href="${link}">${link}</a></p>`,
  });
}

async function sendPasswordReset(user, token) {
  const link = `${FRONTEND_URL}/redefinir-senha?token=${token}`;
  await sendMail({
    to: user.email,
    subject: 'Redefinição de senha — Dravennx',
    html: `<p>Olá, ${user.name}!</p><p>Clique no link abaixo para redefinir sua senha (válido por 1 hora):</p><p><a href="${link}">${link}</a></p><p>Se você não solicitou, ignore este e-mail.</p>`,
  });
}

const STATUS_LABELS = {
  pago: 'Pagamento confirmado',
  em_separacao: 'Seu pedido está em separação',
  enviado: 'Seu pedido foi enviado',
  entregue: 'Seu pedido foi entregue',
  cancelado: 'Seu pedido foi cancelado',
  reembolsado: 'Seu pedido foi reembolsado',
};

async function sendOrderStatusUpdate(user, order) {
  const label = STATUS_LABELS[order.status] || `Status do pedido atualizado: ${order.status}`;
  const trackingInfo = order.trackingCode ? `<p>Código de rastreio: <strong>${order.trackingCode}</strong></p>` : '';
  await sendMail({
    to: user.email,
    subject: `${label} — Pedido ${order.orderNumber}`,
    html: `<p>Olá, ${user.name}!</p><p>${label}.</p>${trackingInfo}<p>Acompanhe todos os detalhes na área "Meus Pedidos".</p>`,
  });
}

module.exports = { sendEmailConfirmation, sendPasswordReset, sendOrderStatusUpdate };
