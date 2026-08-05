export default function Footer() {
  return (
    <footer className="mt-24 border-t-2 border-ink bg-ink text-white">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <p className="font-display text-3xl">DRAVENNX</p>
            <p className="mt-3 max-w-xs text-sm text-white/60">
              Peças de caimento largo, feitas para sobrar — não pra apertar.
              Loja independente de blusas e moletons oversized.
            </p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-white/40">Atendimento</p>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>contato@dravennx.com.br</li>
              <li>Seg a sex, 9h às 18h</li>
              <li>Trocas e devoluções em 30 dias</li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-white/40">Pagamento</p>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>Cartão de crédito em até 6x</li>
              <li>Pix com confirmação na hora</li>
            </ul>
          </div>
        </div>
        <p className="mt-12 font-mono text-[11px] text-white/30">
          © {new Date().getFullYear()} Dravennx
        </p>
      </div>
    </footer>
  );
}
