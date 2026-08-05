const ApiError = require('../utils/apiError');

/**
 * Opções de entrega da loja. Diferente de uma transportadora nacional
 * (Correios/Melhor Envio), Uberflex e 99Flex são serviços de motoboy sob
 * demanda dentro da cidade — não têm uma API pública de cotação por CEP,
 * então os valores aqui são fixos e configuráveis via variável de ambiente
 * pelo lojista. "Combinar com o vendedor" cobra frete zero no checkout e
 * marca o pedido para a equipe entrar em contato depois (RN da loja).
 */
async function quoteShipping({ zip, items }) {
  try {
    const uberflexPrice = Number(process.env.SHIPPING_UBERFLEX_PRICE || 15);
    const flex99Price = Number(process.env.SHIPPING_99FLEX_PRICE || 12);

    return [
      {
        id: 'uberflex',
        name: 'Uberflex (motoboy)',
        price: uberflexPrice,
        estimatedDays: 0,
        note: 'Entrega no mesmo dia, dentro da cidade',
      },
      {
        id: '99flex',
        name: '99Flex (motoboy)',
        price: flex99Price,
        estimatedDays: 0,
        note: 'Entrega no mesmo dia, dentro da cidade',
      },
      {
        id: 'combinar',
        name: 'Combinar com o vendedor',
        price: 0,
        estimatedDays: null,
        note: 'Nossa equipe entra em contato por WhatsApp/telefone para combinar a entrega',
        requiresArrangement: true,
      },
    ];
  } catch (err) {
    throw ApiError.badRequest('Não foi possível calcular o frete para o CEP informado', 'shipping_unavailable');
  }
}

module.exports = { quoteShipping };
