const cron = require('node-cron');
const { Op } = require('sequelize');
const { Order } = require('../models');
const orderService = require('../services/order.service');

const RESERVATION_TIMEOUT_MINUTES = 30;

/**
 * Cancela pedidos em "aguardando_pagamento" criados há mais de 30 minutos e
 * libera o estoque reservado (RF-19, RN-03). Executa a cada 5 minutos.
 */
async function expireStaleReservations() {
  const cutoff = new Date(Date.now() - RESERVATION_TIMEOUT_MINUTES * 60 * 1000);

  const staleOrders = await Order.findAll({
    where: { status: 'aguardando_pagamento', createdAt: { [Op.lt]: cutoff } },
  });

  for (const order of staleOrders) {
    try {
      await orderService.updateOrderStatus(order.id, 'cancelado', {});
      // eslint-disable-next-line no-console
      console.log(`[job] pedido ${order.orderNumber} cancelado por expiração de reserva`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[job] falha ao expirar pedido ${order.orderNumber}:`, err.message);
    }
  }

  return staleOrders.length;
}

function scheduleExpireReservationsJob() {
  // A cada 5 minutos
  cron.schedule('*/5 * * * *', () => {
    expireStaleReservations().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[job] erro inesperado no job de expiração de reservas:', err);
    });
  });
}

module.exports = { scheduleExpireReservationsJob, expireStaleReservations };
