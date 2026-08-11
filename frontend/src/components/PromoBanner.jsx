import Tag from './Tag';

/**
 * Banner de campanha promocional — estrutura pronta pra uma promoção do
 * tipo "compre X e ganhe Y", com ícones dos brindes disponíveis. O texto
 * abaixo é só um placeholder: como isso é uma decisão de negócio (quantas
 * peças, quais brindes, por quanto tempo), ajuste as props quando definir
 * a promoção real — ou me diga os detalhes que eu já deixo fixo.
 */
export default function PromoBanner({
  eyebrow = 'compre 3',
  title = 'blusas',
  subtitle = 'e escolha o brinde',
  gifts = [
    { label: 'Bolsa transversal' },
    { label: 'Boné' },
    { label: 'Camiseta extra' },
  ],
}) {
  return (
    <section className="relative overflow-hidden border-b-2 border-ink bg-canvas-alt text-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <Tag variant="lime">promoção</Tag>
        <p className="font-display mt-4 text-2xl uppercase tracking-wide sm:text-3xl">{eyebrow}</p>
        <p className="font-display text-6xl uppercase leading-[0.85] tracking-tight sm:text-8xl">{title}</p>
        <p className="font-display mt-1 text-2xl uppercase tracking-wide sm:text-3xl">{subtitle}</p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {gifts.map((gift) => (
            <div key={gift.label} className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-white/10 font-mono text-[10px] uppercase leading-tight" title={gift.label}>
              {gift.label.slice(0, 2)}
            </div>
          ))}
          <p className="max-w-[220px] font-mono text-xs text-white/70">
            Escolha o brinde na hora de fechar o pedido.
          </p>
        </div>
      </div>
    </section>
  );
}
