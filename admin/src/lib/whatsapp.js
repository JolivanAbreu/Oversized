/**
 * Monta a URL do wa.me para o ADMIN falar com o CLIENTE sobre o frete de um
 * pedido específico. Usa o telefone salvo no cadastro do cliente — nunca o
 * da loja (esse é o lib/whatsapp.js do frontend, para o caminho inverso).
 */
export function buildCustomerWhatsAppLink(customerPhone, order) {
  const digits = (customerPhone || '').replace(/\D/g, '');
  if (!digits) return null;

  // Assume Brasil (+55) quando o telefone salvo não já vem com código de país
  const withCountryCode = digits.length <= 11 ? `55${digits}` : digits;

  const lines = [
    `Olá! Aqui é da Dravennx sobre o seu pedido *${order.orderNumber}*.`,
    'Vamos combinar o frete — pode confirmar o endereço e o melhor horário para a entrega?',
  ];
  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${withCountryCode}?text=${text}`;
}
