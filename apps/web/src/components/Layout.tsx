import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../offline/sync-provider';
import { usePwaInstall } from '../offline/use-pwa-install';
import { applyPrimeTheme } from '../theme/primeTheme';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'fa-chart-line' },
  { to: '/miembros', label: 'Miembros', icon: 'fa-users' },
  { to: '/facturas', label: 'Facturas', icon: 'fa-file-invoice-dollar' },
  { to: '/inventario', label: 'Inventario', icon: 'fa-boxes-stacked' },
  { to: '/maquinas', label: 'Máquinas', icon: 'fa-dumbbell' },
  { to: '/rutinas', label: 'Rutinas', icon: 'fa-calendar-check' },
  { to: '/colaboradores', label: 'Colaboradores', icon: 'fa-people-group' },
];

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  );
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
    applyPrimeTheme(theme);
  }, [theme]);
  return { theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) };
}

function OnlineStatus() {
  const { isOnline, pendingSync, syncing, lastSyncAt, syncNow } = useSync();
  const [showDetail, setShowDetail] = useState(false);
  const [swUpdate, setSwUpdate] = useState(false);

  useEffect(() => {
    const handler = () => setSwUpdate(true);
    window.addEventListener('sw-update', handler);
    return () => window.removeEventListener('sw-update', handler);
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-2">
      {/* Service worker update banner */}
      {swUpdate && (
        <button
          onClick={handleUpdate}
          className="text-xs bg-brand/15 text-brand px-2 py-1 rounded-lg font-semibold hover:bg-brand/25 transition-colors"
        >
          <i className="fa-solid fa-arrow-up mr-1" />
          Actualizar
        </button>
      )}

      {/* Online/offline dot */}
      <button
        onClick={() => setShowDetail(!showDetail)}
        className="relative flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
        title={isOnline ? 'En línea' : 'Sin conexión — modo offline'}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
          }`}
        />
        <span className="hidden sm:inline text-muted">
          {isOnline ? 'Online' : 'Offline'}
        </span>
        {pendingSync > 0 && (
          <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
            {pendingSync}
          </span>
        )}
      </button>

      {/* Detail dropdown */}
      {showDetail && (
        <div className="absolute top-full right-2 mt-1 w-56 bg-surface border border-border rounded-xl shadow-lg p-3 z-50 animate-fade-up">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-sm font-semibold">
              {isOnline ? 'Conectado' : 'Sin conexión'}
            </span>
          </div>
          <p className="text-xs text-muted mb-2">
            Los datos se guardan localmente{!isOnline ? ' y se sincronizarán al reconectar' : ''}.
          </p>
          {pendingSync > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
              <i className="fa-solid fa-clock mr-1" />
              {pendingSync} cambio{pendingSync > 1 ? 's' : ''} pendiente{pendingSync > 1 ? 's' : ''} de sincronizar
            </p>
          )}
          {syncing && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
              <i className="fa-solid fa-sync fa-spin mr-1" />
              Sincronizando...
            </p>
          )}
          {lastSyncAt && (
            <p className="text-xs text-muted mb-2">
              Última sync: {new Date(lastSyncAt).toLocaleTimeString()}
            </p>
          )}
          {isOnline && pendingSync > 0 && !syncing && (
            <button
              onClick={() => { syncNow(); setShowDetail(false); }}
              className="w-full text-xs bg-brand text-white py-1.5 rounded-lg font-semibold hover:bg-brand-strong transition-colors"
            >
              <i className="fa-solid fa-sync mr-1" />
              Sincronizar ahora
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SidebarContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const { canInstall, install } = usePwaInstall();

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-white">
      <div
        className={`p-4 border-b border-neutral-700 flex items-center gap-2 ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        <i className="fa-solid fa-dumbbell text-brand" />
        {!collapsed && <span className="text-xl font-bold">Gym Multiempresa</span>}
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                active
                  ? 'bg-brand/20 text-white font-semibold'
                  : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <i className={`fa-solid ${item.icon} w-5 text-center ${active ? 'text-brand' : ''}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-3 border-t border-neutral-700 text-sm">
          <p className="font-semibold">{user?.nombre}</p>
          <p className="text-neutral-400">{user?.email}</p>
          {canInstall && (
            <button
              onClick={install}
              className="mt-2 w-full text-left text-emerald-400 hover:text-emerald-300 flex items-center gap-2"
            >
              <i className="fa-solid fa-download" />
              Instalar app
            </button>
          )}
          <button
            onClick={toggle}
            className="mt-2 w-full text-left text-neutral-300 hover:text-white flex items-center gap-2"
          >
            <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} />
            {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </button>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="mt-2 w-full text-left text-red-400 hover:text-red-300 flex items-center gap-2"
          >
            <i className="fa-solid fa-right-from-bracket" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === '1',
  );

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar fijo en escritorio */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-border transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* Drawer móvil */}
      <div className={`md:hidden fixed inset-0 z-40 ${mobileOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-60 shadow-xl transform transition-transform duration-200 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </aside>
      </div>

      {/* Contenido */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border bg-surface">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-content p-2 -ml-2"
              aria-label="Abrir menú"
            >
              <i className="fa-solid fa-bars" />
            </button>
            <span className="md:hidden font-bold">Gym Multiempresa</span>
          </div>
          <div className="relative">
            <OnlineStatus />
          </div>
        </header>

        {/* Botón colapsar en escritorio */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden md:flex items-center gap-2 px-4 py-2 text-muted hover:text-content border-b border-border bg-surface"
          aria-label="Colapsar menú"
        >
          <i className={`fa-solid ${collapsed ? 'fa-angles-right' : 'fa-angles-left'}`} />
          <span className="text-sm">{collapsed ? 'Expandir' : 'Colapsar'}</span>
        </button>

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-bg text-content">
          <div className="max-w-[1800px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
