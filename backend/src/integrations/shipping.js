const ApiError = require('../utils/apiError');

/**
 * Cliente de integração com a API de frete (ex.: Melhor Envio). Isolado em um
 * módulo próprio para que uma falha externa (RNF-11) não derrube o checkout —
 * o service que chama esta função decide o fallback (ex.: frete padrão fixo).
 */
async function quoteShipping({ zip, items }) {
  try {
    // Placeholder de integração real. Substituir pela chamada HTTP ao provedor
    // de frete escolhido, usando SHIPPING_API_TOKEN.
    //
    // const response = await fetch('https://api.melhorenvio.com.br/v2/me/shipment/calculate', {
    //   method: 'POST',
    //   headers: { Authorization: `Bearer ${process.env.SHIPPING_API_TOKEN}` },
    //   body: JSON.stringify({ to: { postal_code: zip }, products: items }),
    // });
    // if (!response.ok) throw new Error('shipping_provider_error');
    // return await response.json();

    return [
      { id: 'standard', name: 'Envio Padrão', price: 19.9, estimatedDays: 7 },
      { id: 'express', name: 'Envio Expresso', price: 34.9, estimatedDays: 3 },
    ];
  } catch (err) {
    throw ApiError.badRequest('Não foi possível calcular o frete para o CEP informado', 'shipping_unavailable');
  }
}

module.exports = { quoteShipping };
