import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuthModal } from '../context/AuthModalContext';
import { UserIcon, StarIcon, BagIcon, BoxIcon } from './HeaderIcons';

function IconBadge({ count }) {
  if (!count) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-[16px] w-[16px] items-center justify-center rounded-full border-[1.5px] border-ink bg-danger text-[9px] font-bold text-white">
      {count}
    </span>
  );
}

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { openLoginModal } = useAuthModal();
  const location = useLocation();
  const navigate = useNavigate();

  const isPanelUser = user?.role === 'admin' || user?.role === 'operator';
  const adminPanelUrl = import.meta.env.VITE_ADMIN_PANEL_URL || 'http://localhost:5174';

  const [menuOpen, setMenuOpen] = useState(false);

  // "Vestuário" e "Acessórios" apontam pra rotas DIFERENTES (uma sem filtro
  // de categoria, outra filtrando por "acessorios") — antes ambas apontavam
  // pro mesmo /produtos, então os dois links acendiam juntos sempre que a
  // pessoa estava em /produtos, não importa qual tivesse sido clicado.
  const currentCategory = new URLSearchParams(location.search).get('category') || '';
  const onCatalog = location.pathname === '/produtos';
  const isVestuarioActive = onCatalog && currentCategory !== 'acessorios';
  const isAcessoriosActive = onCatalog && currentCategory === 'acessorios';

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleAuthClick() {
    if (isAuthenticated) {
      logout();
    } else {
      openLoginModal();
    }
    closeMenu();
  }

  function goToCart() {
    closeMenu();
    navigate('/carrinho');
  }

  const desktopNavClass = (active) => `nav-hover-underline inline-flex items-center ${active ? 'text-tag' : 'text-white'}`;
  const mobileNavClass = (active) =>
    `flex items-center justify-between border-b border-white/10 py-3 font-mono text-sm uppercase tracking-widest ${active ? 'text-tag' : 'text-white'}`;

  return (
    <>
      {menuOpen && (
        <div className="fixed inset-0 z-[190] bg-black/50 backdrop-blur-[2px] md:hidden" onClick={closeMenu} aria-hidden="true" />
      )}
      <aside className={`fixed left-0 top-0 z-[200] flex h-full w-72 transform flex-col bg-[#222222] px-5 py-6 text-white transition-transform duration-300 md:hidden ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <Link to="/" onClick={closeMenu} className="font-display text-xl">DRAVENNX<span className="text-tag">®</span></Link>
          <button onClick={closeMenu} aria-label="Fechar menu" className="text-white/70 hover:text-white">✕</button>
        </div>
        <nav className="mt-4 flex-1">
          <Link to="/produtos" onClick={closeMenu} className={mobileNavClass(isVestuarioActive)}>Vestuário</Link>
          <Link to="/produtos?category=acessorios" onClick={closeMenu} className={mobileNavClass(isAcessoriosActive)}>Acessórios</Link>
          <Link to="/minha-conta/pedidos" onClick={closeMenu} className={mobileNavClass(location.pathname === '/minha-conta/pedidos')}>Meus pedidos</Link>
          <Link to="/carrinho" onClick={closeMenu} className={mobileNavClass(location.pathname === '/carrinho')}>Minha sacola</Link>
          <Link to="/minha-conta" onClick={closeMenu} className={mobileNavClass(location.pathname === '/minha-conta')}>Meu perfil</Link>
          <Link to="/minha-conta/favoritos" onClick={closeMenu} className={mobileNavClass(location.pathname === '/minha-conta/favoritos')}>Favoritos</Link>
          {isPanelUser && (
            <a
              href={adminPanelUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className="flex items-center justify-between border-b border-white/10 py-3 font-mono text-sm uppercase tracking-widest text-tag"
            >
              Painel administrativo
            </a>
          )}
          <button onClick={handleAuthClick} className="mt-3 flex w-full items-center justify-between py-3 font-mono text-sm uppercase tracking-widest text-white">
            {isAuthenticated ? 'Sair' : 'Entrar'}
          </button>
        </nav>
        <div className="mt-6 flex justify-around border-t border-white/10 pt-5">
          <Link to="/minha-conta" onClick={closeMenu} className="text-white/80 hover:text-tag" aria-label="Minha conta"><UserIcon /></Link>
          <Link to="/minha-conta/favoritos" onClick={closeMenu} className="text-white/80 hover:text-tag" aria-label="Favoritos"><StarIcon /></Link>
          <Link to="/minha-conta/pedidos" onClick={closeMenu} className="text-white/80 hover:text-tag" aria-label="Meus pedidos"><BoxIcon /></Link>
        </div>
      </aside>

      <header className="sticky top-2.5 z-40 px-2.5 sm:top-[10px] sm:px-4">
        <div className="mx-auto max-w-7xl">
          <nav className="relative flex h-12 items-center justify-between rounded-full bg-ink px-4 text-white shadow-[0_4px_16px_rgba(0,0,0,0.15)] sm:px-6">
            <button onClick={() => setMenuOpen(true)} className="flex items-center justify-center p-1 md:hidden" aria-label="Abrir menu">
              <span className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-5 bg-white" />
                <span className="block h-0.5 w-5 bg-white" />
                <span className="block h-0.5 w-5 bg-white" />
              </span>
            </button>

            <ul className="hidden items-center gap-5 md:flex">
              <li><Link to="/produtos" className={desktopNavClass(isVestuarioActive)}>Vestuário</Link></li>
              <li><Link to="/produtos?category=acessorios" className={desktopNavClass(isAcessoriosActive)}>Acessórios</Link></li>
            </ul>

            <Link
              to="/"
              onClick={closeMenu}
              className="absolute left-1/2 -translate-x-1/2 font-display text-lg tracking-tight transition-transform duration-200 hover:scale-105 sm:text-xl"
            >
              DRAVENNX<span className="text-tag">®</span>
            </Link>

            <div className="flex items-center gap-1 sm:gap-3">
              <Link to="/minha-conta/pedidos" className="nav-hover-underline hidden items-center gap-1.5 text-white lg:inline-flex">
                <BoxIcon className="h-3.5 w-3.5" /> Meus pedidos
              </Link>

              {isPanelUser && (
                <a
                  href={adminPanelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-hover-underline hidden items-center gap-1.5 text-tag sm:inline-flex"
                  title="Abrir o painel administrativo em uma nova aba"
                >
                  Painel
                </a>
              )}

              <button onClick={handleAuthClick} className="nav-hover-underline hidden items-center gap-1.5 text-white sm:inline-flex">
                {isAuthenticated ? 'Sair' : 'Entrar'}
              </button>

              <div className="group relative flex items-center justify-center py-1.5">
                <button
                  onClick={goToCart}
                  aria-label="Ver sacola"
                  className="relative flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white text-ink transition-all group-hover:scale-110 group-hover:bg-tag group-hover:shadow-[0_0_10px_rgba(0,253,119,0.4)]"
                >
                  <BagIcon className="h-4 w-4" />
                  <IconBadge count={itemCount} />
                </button>

                {/* Coluna de atalhos: aparece ao passar o mouse em qualquer
                    parte deste grupo (ícone + a própria coluna). No celular,
                    esses atalhos já estão no menu hambúrguer. */}
                <div className="pointer-events-none absolute left-1/2 top-full z-[15] w-11 -translate-x-1/2 overflow-hidden rounded-b-lg border border-transparent bg-ink px-0 py-3.5 opacity-0 shadow-[0_6px_16px_rgba(0,0,0,0.25)] transition-all duration-300 group-hover:pointer-events-auto group-hover:w-[155px] group-hover:border-white/10 group-hover:px-2.5 group-hover:opacity-100">
                  <Link to="/minha-conta" onClick={closeMenu} className="sidebar-shortcut">
                    <UserIcon className="h-4 w-4 shrink-0" /> <span className="opacity-0 transition-opacity group-hover:opacity-100">Perfil</span>
                  </Link>
                  <Link to="/minha-conta/favoritos" onClick={closeMenu} className="sidebar-shortcut relative">
                    <StarIcon className="h-4 w-4 shrink-0" /> <span className="opacity-0 transition-opacity group-hover:opacity-100">Favoritos</span>
                    {wishlistItems.length > 0 && <span className="absolute left-3 top-0 h-2 w-2 rounded-full bg-tag" />}
                  </Link>
                  <Link to="/minha-conta/pedidos" onClick={closeMenu} className="sidebar-shortcut">
                    <BoxIcon className="h-4 w-4 shrink-0" /> <span className="opacity-0 transition-opacity group-hover:opacity-100">Pedidos</span>
                  </Link>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
