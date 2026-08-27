import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../offline/sync-provider';
import { usePwaInstall } from '../offline/use-pwa-install';
import { applyPrimeTheme } from '../theme/primeTheme';

const baseNavItems = [
  { to: '/', label: 'Dashboard', icon: 'fa-chart-line', roles: ['super_admin', 'admin', 'recepcionista'] },
  { to: '/miembros', label: 'Miembros', icon: 'fa-users', roles: ['admin', 'recepcionista'] },
  { to: '/facturas', label: 'Facturas', icon: 'fa-file-invoice-dollar', roles: ['admin', 'recepcionista'] },
  { to: '/inventario', label: 'Inventario', icon: 'fa-boxes-stacked', roles: ['admin', 'recepcionista'] },
  { to: '/maquinas', label: 'Máquinas', icon: 'fa-dumbbell', roles: ['admin', 'recepcionista'] },
  { to: '/rutinas', label: 'Rutinas', icon: 'fa-calendar-check', roles: ['admin', 'recepcionista'] },
  { to: '/colaboradores', label: 'Colaboradores', icon: 'fa-people-group', roles: ['admin', 'recepcionista'] },
  { to: '/super-admin', label: 'Panel Admin', icon: 'fa-shield-halved', roles: ['super_admin'] },
  { to: '/configuracion', label: 'Configuración', icon: 'fa-gear', roles: ['super_admin', 'admin'] },
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
      {swUpdate && (
        <button
          onClick={handleUpdate}
          className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
          style={{ background: 'rgba(var(--brand-rgb),0.08)', color: 'var(--brand)' }}
        >
          <i className="fa-solid fa-arrow-up mr-1" />
          Actualizar
        </button>
      )}

      <button
        onClick={() => setShowDetail(!showDetail)}
        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors"
        style={{ background: 'var(--border)' }}
        title={isOnline ? 'En línea' : 'Sin conexión'}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: isOnline ? '#3da06e' : '#f59e0b' }}
        />
        <span style={{ color: 'var(--text-muted)' }}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
        {pendingSync > 0 && (
          <span
            className="text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none"
            style={{ background: '#f59e0b' }}
          >
            {pendingSync}
          </span>
        )}
      </button>

      {showDetail && (
        <div
          className="absolute top-full right-2 mt-1 w-56 p-3 z-50 animate-fade-up"
          style={{
            background: 'var(--surface)',
            border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: isOnline ? '#3da06e' : '#f59e0b' }}
            />
            <span className="text-sm font-semibold">
              {isOnline ? 'Conectado' : 'Sin conexión'}
            </span>
          </div>
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
            Los datos se guardan localmente{!isOnline ? ' y se sincronizarán al reconectar' : ''}.
          </p>
          {pendingSync > 0 && (
            <p className="text-xs mb-2" style={{ color: '#f59e0b' }}>
              <i className="fa-solid fa-clock mr-1" />
              {pendingSync} cambio{pendingSync > 1 ? 's' : ''} pendiente{pendingSync > 1 ? 's' : ''}
            </p>
          )}
          {syncing && (
            <p className="text-xs mb-2" style={{ color: '#60a5fa' }}>
              <i className="fa-solid fa-sync fa-spin mr-1" />
              Sincronizando...
            </p>
          )}
          {lastSyncAt && (
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              Última sync: {new Date(lastSyncAt).toLocaleTimeString()}
            </p>
          )}
          {isOnline && pendingSync > 0 && !syncing && (
            <button
              onClick={() => { syncNow(); setShowDetail(false); }}
              className="w-full text-xs font-semibold py-2 rounded-xl transition-colors"
              style={{ background: 'var(--text)', color: 'var(--bg)' }}
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
    <div
      className="flex flex-col h-full"
      style={{ background: '#0A0A0A', color: '#ddd' }}
    >
      {/* Brand */}
      <div
        className={`px-4 py-5 flex items-center gap-3 ${collapsed ? 'justify-center px-2' : ''}`}
        style={{ borderBottom: '1px solid #1A1A1A' }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--brand)', boxShadow: '0 0 20px rgba(var(--brand-rgb), 0.3)' }}
        >
          <i className="fa-solid fa-dumbbell text-white text-sm" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>Nexus Fit</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {baseNavItems
          .filter((item) => user?.rol && item.roles.includes(user.rol as string))
          .map((item) => {
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  collapsed ? 'justify-center' : ''
                }`}
                style={{
                  background: active ? 'rgba(var(--brand-rgb),0.15)' : 'transparent',
                  color: active ? 'var(--brand)' : '#999',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <i
                  className={`fa-solid ${item.icon} w-5 text-center text-sm`}
                  style={{ color: active ? '#3da06e' : undefined }}
                />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      {!collapsed && (
        <div
          className="p-3 text-sm"
          style={{ borderTop: '1px solid #2a2a2a' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: 'rgba(61,160,110,0.15)', color: '#3da06e' }}
            >
              {user?.nombre?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate text-sm">{user?.nombre}</p>
              <p className="text-xs truncate" style={{ color: '#666' }}>{user?.email}</p>
            </div>
          </div>

          <div className="space-y-0.5 mt-3">
            {canInstall && (
              <button
                onClick={install}
                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ color: '#3da06e' }}
              >
                <i className="fa-solid fa-download text-xs" />
                Instalar app
              </button>
            )}
            <button
              onClick={toggle}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ color: '#999' }}
            >
              <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-xs`} />
              {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ color: '#e05555' }}
            >
              <i className="fa-solid fa-right-from-bracket text-xs" />
              Cerrar sesión
            </button>
          </div>
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
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col shrink-0 transition-all duration-200"
        style={{
          borderRight: '1px solid var(--border)',
          width: collapsed ? 64 : 240,
        }}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* Mobile drawer */}
      <div className={`md:hidden fixed inset-0 z-40 ${mobileOpen ? '' : 'pointer-events-none'}`}>
        <div
          className="absolute inset-0 transition-opacity duration-200"
          style={{
            background: 'rgba(0,0,0,0.5)',
            opacity: mobileOpen ? 1 : 0,
          }}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className="absolute inset-y-0 left-0 w-64 transition-transform duration-200"
          style={{
            boxShadow: '0 4px 32px rgba(0,0,0,0.2)',
            transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          }}
        >
          <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </aside>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className="flex items-center justify-between gap-3 px-4 py-3"
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'var(--nav-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-xl transition-colors"
              style={{ color: 'var(--text)' }}
              aria-label="Abrir menu"
            >
              <i className="fa-solid fa-bars" />
            </button>
            <span className="md:hidden font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>Nexus Fit</span>
          </div>
          <div className="relative hidden sm:block">
            <OnlineStatus />
          </div>
        </header>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden md:flex items-center gap-2 px-4 py-2 text-sm transition-colors"
          style={{
            borderBottom: '1px solid var(--border)',
            color: 'var(--text-muted)',
            background: 'var(--surface)',
          }}
          aria-label="Colapsar menu"
        >
          <i className={`fa-solid ${collapsed ? 'fa-angles-right' : 'fa-angles-left'}`} />
          <span>{collapsed ? 'Expandir' : 'Colapsar'}</span>
        </button>

        <main
          className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6"
          style={{ background: 'var(--bg)', color: 'var(--text)' }}
        >
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
