import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-white text-ink' : 'text-white/70 hover:bg-white/10 hover:text-white'
  }`;

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col bg-ink px-4 py-6">
        <div className="px-2">
          <p className="font-display text-xl text-white">DRAVENNX</p>
          <p className="text-[11px] uppercase tracking-widest text-white/40">Painel administrativo</p>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          <NavLink to="/pedidos" className={linkClass}>Pedidos</NavLink>
          <NavLink to="/produtos" className={linkClass}>Produtos</NavLink>
          {isAdmin && <NavLink to="/categorias" className={linkClass}>Categorias</NavLink>}
          {isAdmin && <NavLink to="/cupons" className={linkClass}>Cupons</NavLink>}
          {isAdmin && <NavLink to="/relatorios" className={linkClass}>Relatórios</NavLink>}
          {isAdmin && <NavLink to="/usuarios" className={linkClass}>Usuários</NavLink>}
          {isAdmin && <NavLink to="/" end className={linkClass}>Dashboard</NavLink>}
        </nav>

        <div className="border-t border-white/10 pt-4">
          <a
            href={import.meta.env.VITE_STORE_URL || 'http://localhost:5173'}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
          >
            Ver loja ↗
          </a>
          <NavLink to="/minha-conta" className="block rounded-md px-2 py-1.5 hover:bg-white/10">
            <p className="text-xs text-white/60">{user?.name}</p>
            <p className="text-[11px] uppercase tracking-widest text-white/30">{user?.role === 'admin' ? 'Administrador' : 'Operador'} · editar dados</p>
          </NavLink>
          <button onClick={logout} className="mt-2 w-full rounded-md px-2 py-2 text-left text-xs uppercase tracking-widest text-white/50 hover:bg-white/10 hover:text-white">
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
