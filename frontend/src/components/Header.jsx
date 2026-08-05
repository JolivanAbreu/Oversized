import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const navLinkClass = ({ isActive }) =>
  `font-mono text-xs uppercase tracking-widest border-b-2 pb-1 transition-colors ${
    isActive ? 'border-tag text-tag' : 'border-transparent text-white/80 hover:text-white'
  }`;

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-ink text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <Link to="/" className="font-display text-2xl tracking-tight sm:text-3xl">
          BLUS<span className="text-tag">Ã</span>O
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/produtos" className={navLinkClass}>Loja</NavLink>
          <NavLink to="/produtos?category=blusas-oversized" className={navLinkClass}>Blusas</NavLink>
          {isAuthenticated && <NavLink to="/minha-conta/pedidos" className={navLinkClass}>Meus pedidos</NavLink>}
          {isAuthenticated && <NavLink to="/minha-conta/enderecos" className={navLinkClass}>Endereços</NavLink>}
        </nav>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="hidden items-center gap-3 sm:flex">
              <Link to="/minha-conta" className="font-mono text-xs text-white/70 hover:text-tag">Olá, {user.name.split(' ')[0]}</Link>
              <button onClick={logout} className="font-mono text-xs uppercase text-white/70 underline decoration-dotted hover:text-tag">
                Sair
              </button>
            </div>
          ) : (
            <Link to="/entrar" className="hidden font-mono text-xs uppercase tracking-widest text-white/80 hover:text-tag sm:block">
              Entrar
            </Link>
          )}

          <Link to="/carrinho" className="relative border-2 border-white/30 px-3 py-2 font-mono text-xs uppercase tracking-widest hover:border-tag hover:text-tag">
            Sacola
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-tag text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="overflow-hidden border-t border-white/10 bg-ink py-1.5">
        <div className="animate-marquee flex w-max gap-10 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="flex gap-10">
              <span>Frete grátis acima de R$ 250</span>
              <span>Pix ou cartão em até 6x</span>
              <span>Caimento oversized · unissex</span>
              <span>Troca fácil em 30 dias</span>
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
