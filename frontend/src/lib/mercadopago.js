const PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

let sdkPromise = null;

function loadSdk() {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    if (window.MercadoPago) return resolve(window.MercadoPago);
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => resolve(window.MercadoPago);
    script.onerror = () => reject(new Error('Falha ao carregar o SDK do Mercado Pago'));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export function isCardPaymentConfigured() {
  return !!PUBLIC_KEY;
}

/**
 * Tokeniza os dados do cartão diretamente no navegador via SDK oficial do
 * Mercado Pago — o número, validade e CVV NUNCA são enviados ao nosso
 * backend, apenas o token resultante (mesma regra do RNF-06 documentado).
 *
 * Requer VITE_MERCADOPAGO_PUBLIC_KEY configurada no .env do frontend com uma
 * chave pública de sandbox/produção do Mercado Pago.
 */
export async function tokenizeCard({ cardNumber, cardholderName, expirationMonth, expirationYear, securityCode, identificationNumber }) {
  if (!PUBLIC_KEY) {
    throw new Error(
      'Pagamento por cartão não está configurado neste ambiente (falta VITE_MERCADOPAGO_PUBLIC_KEY). Use Pix ou configure a chave pública de sandbox.'
    );
  }

  const MercadoPago = await loadSdk();
  const mp = new MercadoPago(PUBLIC_KEY, { locale: 'pt-BR' });

  const result = await mp.createCardToken({
    cardNumber: cardNumber.replace(/\s/g, ''),
    cardholderName,
    cardExpirationMonth: expirationMonth,
    cardExpirationYear: expirationYear,
    securityCode,
    identificationType: 'CPF',
    identificationNumber: identificationNumber.replace(/\D/g, ''),
  });

  return result.id;
}

export async function getInstallmentOptions({ amount, bin }) {
  if (!PUBLIC_KEY || !bin) return [1];
  try {
    const MercadoPago = await loadSdk();
    const mp = new MercadoPago(PUBLIC_KEY, { locale: 'pt-BR' });
    const { results } = await mp.getInstallments({ amount: String(amount), bin, locale: 'pt-BR' });
    return results?.[0]?.payer_costs?.map((c) => c.installments) || [1];
  } catch (err) {
    return [1];
  }
}
