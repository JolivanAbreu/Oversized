const ApiError = require('../utils/apiError');

/**
 * Opções de entrega da loja. Uber Flash e 99 são apps externos de corrida —
 * a loja não cobra nem define o valor da corrida: o cliente pede direto no
 * app e paga o valor mostrado lá (por isso price: 0 aqui, e
 * contactMethod: 'customer_app' avisa o frontend a mostrar essa instrução
 * em vez de "vamos te chamar no WhatsApp"). "Combinar com o vendedor" é o
 * caso oposto — a loja que entra em contato (contactMethod: 'store').
 */
async function quoteShipping({ zip, items }) {
  try {
    return [
      {
        id: 'uberflex',
        name: 'Uber Flash',
        price: 0,
        estimatedDays: 0,
        note: 'Peça a coleta direto no app Uber — o valor da corrida aparece por lá.',
        requiresArrangement: true,
        contactMethod: 'customer_app',
      },
      {
        id: '99flex',
        name: '99',
        price: 0,
        estimatedDays: 0,
        note: 'Peça a coleta direto no app 99 — o valor da corrida aparece por lá.',
        requiresArrangement: true,
        contactMethod: 'customer_app',
      },
      {
        id: 'combinar',
        name: 'Combinar com o vendedor',
        price: 0,
        estimatedDays: null,
        note: 'Nossa equipe entra em contato por WhatsApp/telefone para combinar a entrega',
        requiresArrangement: true,
        contactMethod: 'store',
      },
    ];
  } catch (err) {
    throw ApiError.badRequest('Não foi possível calcular o frete para o CEP informado', 'shipping_unavailable');
  }
}

module.exports = { quoteShipping };
