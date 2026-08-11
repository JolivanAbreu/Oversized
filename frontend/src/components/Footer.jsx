import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-24 rounded-t-xl bg-ink text-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-4">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-white/40">Institucional</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li><Link to="/" className="hover:text-white">Sobre a Dravennx</Link></li>
              <li><Link to="/produtos" className="hover:text-white">Nossa loja</Link></li>
              <li>Políticas de privacidade</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-white/40">Ajuda e suporte</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>Fale conosco</li>
              <li>Trocas e devoluções</li>
              <li>Prazos de entrega</li>
              <li>Guia de tamanhos</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-white/40">Minha conta</p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li><Link to="/minha-conta/pedidos" className="hover:text-white">Meus pedidos</Link></li>
              <li><Link to="/carrinho" className="hover:text-white">Minha sacola</Link></li>
              <li><Link to="/minha-conta" className="hover:text-white">Meu perfil</Link></li>
              <li><Link to="/minha-conta/favoritos" className="hover:text-white">Meus favoritos</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-white/40">Newsletter</p>
            <p className="mt-4 text-xs text-white/60">Cadastre-se e receba promoções exclusivas.</p>
            <form onSubmit={(e) => e.preventDefault()} className="mt-3 flex flex-col gap-2">
              <input
                type="email"
                required
                placeholder="Digite seu e-mail"
                className="rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-tag"
              />
              <button type="submit" className="rounded-md bg-white py-2 text-xs font-black uppercase tracking-widest text-ink hover:bg-white/90">
                Cadastrar
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-[11px] text-white/40">
          © {new Date().getFullYear()} Dravennx — Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
