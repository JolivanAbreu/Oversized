import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Package, Shirt, Layers, Image, Star, Camera,
  Ticket, BarChart3, Users, ExternalLink, Menu, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-white text-ink' : 'text-white/70 hover:bg-white/10 hover:text-white'
  }`;

// Agrupa a navegação por assunto em vez de uma lista solta de 9 itens —
// cada seção tem um rótulo curto (não é clicável, só organiza visualmente)
// e só os links relevantes pro que o admin está fazendo naquele momento.
function useNavSections(isAdmin) {
  const sections = [
    {
      label: 'Vendas',
      items: [
        { to: '/pedidos', label: 'Pedidos', icon: Package },
        ...(isAdmin ? [
          { to: '/cupons', label: 'Cupons', icon: Ticket },
          { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
        ] : []),
      ],
    },
    {
      label: 'Catálogo',
      items: [
        { to: '/produtos', label: 'Produtos', icon: Shirt },
        ...(isAdmin ? [{ to: '/categorias', label: 'Categorias', icon: Layers }] : []),
      ],
    },
    ...(isAdmin ? [{
      label: 'Vitrine da loja',
      items: [
        { to: '/banner-promocional', label: 'Banner', icon: Image },
        { to: '/destaques', label: 'Destaques', icon: Star },
        { to: '/instagram', label: 'Instagram', icon: Camera },
      ],
    }] : []),
    ...(isAdmin ? [{
      label: 'Administração',
      items: [
        { to: '/usuarios', label: 'Usuários', icon: Users },
        { to: '/', end: true, label: 'Dashboard', icon: LayoutDashboard },
      ],
    }] : []),
  ];
  return sections.filter((s) => s.items.length > 0);
}

function NavContent({ onNavigate }) {
  const { user, isAdmin, logout } = useAuth();
  const sections = useNavSections(isAdmin);

  return (
    <>
      <div className="px-2">
        <p className="font-display text-xl text-white">DRAVENNX</p>
        <p className="text-[11px] uppercase tracking-widest text-white/40">Painel administrativo</p>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/35">{section.label}</p>
            <div className="flex flex-col gap-1">
              {section.items.map(({ to, end, label, icon: Icon }) => (
                <NavLink key={to} to={to} end={end} className={linkClass} onClick={onNavigate}>
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 pt-4">
        <a
          href={import.meta.env.VITE_STORE_URL || 'http://localhost:5173'}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
        >
          <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={2} /> Ver loja
        </a>
        <NavLink to="/minha-conta" onClick={onNavigate} className="block rounded-md px-3 py-1.5 hover:bg-white/10">
          <p className="text-xs text-white/60">{user?.name}</p>
          <p className="text-[11px] uppercase tracking-widest text-white/30">{user?.role === 'admin' ? 'Administrador' : 'Operador'} · editar dados</p>
        </NavLink>
        <button onClick={logout} className="mt-2 w-full rounded-md px-3 py-2 text-left text-xs uppercase tracking-widest text-white/50 hover:bg-white/10 hover:text-white">
          Sair
        </button>
      </div>
    </>
  );
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar fixa — telas médias/grandes */}
      <aside className="hidden w-60 shrink-0 flex-col bg-ink px-4 py-6 lg:flex">
        <NavContent />
      </aside>

      {/* Sidebar retrátil — celular/tablet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col bg-ink px-4 py-6 transition-transform duration-200 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setMobileOpen(false)} aria-label="Fechar menu" className="absolute right-3 top-3 text-white/60 hover:text-white">
          <X className="h-5 w-5" />
        </button>
        <NavContent onNavigate={() => setMobileOpen(false)} />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-line bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setMobileOpen(true)} aria-label="Abrir menu" className="text-ink/70 hover:text-ink">
            <Menu className="h-5 w-5" />
          </button>
          <p className="font-display text-base">DRAVENNX</p>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
