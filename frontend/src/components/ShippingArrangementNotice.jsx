import { useEffect, useState } from 'react';
import { getStoreInfo, buildShippingWhatsAppLink } from '../lib/whatsapp';
import Button from './Button';

export default function ShippingArrangementNotice({ order }) {
  const [whatsappNumber, setWhatsappNumber] = useState(null);

  useEffect(() => {
    getStoreInfo().then((info) => setWhatsappNumber(info.whatsappNumber));
  }, []);

  if (!order.requiresShippingArrangement) return null;

  // Duas situações bem diferentes compartilham requiresShippingArrangement:
  // "combinar com o vendedor" (a loja entra em contato) e Uber Flash/99
  // (o próprio cliente pede e paga direto no app — a loja não participa
  // da corrida nem sabe o valor).
  if (order.shippingContactMethod === 'customer_app') {
    return (
      <div className="mt-6 border-2 border-ink bg-canvas-alt p-4">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">
          Entrega via {order.shippingMethodName || 'app de corrida'}
        </p>
        <p className="mt-1 text-sm">
          Peça a coleta direto no app — informe o endereço abaixo. O valor da corrida aparece por lá, a loja não participa desse pagamento.
        </p>
        {order.address && (
          <p className="mt-2 font-mono text-xs text-ink-soft">
            {order.address.street}, {order.address.number} — {order.address.neighborhood}, {order.address.city}/{order.address.state}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 border-2 border-ink bg-canvas-alt p-4">
      <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">Frete a combinar</p>
      <p className="mt-1 text-sm">
        Você escolheu combinar a entrega direto com a gente. Fale no WhatsApp pra acertar valor e prazo.
      </p>
      {whatsappNumber ? (
        <Button
          as="a"
          href={buildShippingWhatsAppLink(whatsappNumber, order)}
          target="_blank"
          rel="noopener noreferrer"
          variant="tag"
          size="sm"
          className="mt-3"
        >
          Falar no WhatsApp
        </Button>
      ) : (
        <p className="mt-3 font-mono text-xs text-ink-soft">
          Nosso WhatsApp ainda não está configurado — entre em contato pelos outros canais no rodapé.
        </p>
      )}
    </div>
  );
}
