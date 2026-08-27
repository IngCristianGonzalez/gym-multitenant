import { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';

interface Empresa {
  id: string;
  nombre: string;
  nit: string;
  logoUrl: string | null;
  colorPrimario: string;
  resolucionFactura: string | null;
  prefijoFactura: string;
}

interface User {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  createdAt: string;
}

export default function Configuracion() {
  const { user } = useAuth();
  const isSuperAdmin = user?.rol === 'super_admin';
  const isAdmin = user?.rol === 'admin' || isSuperAdmin;

  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit form
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState('#2b8a3e');
  const [resolucion, setResolucion] = useState('');
  const [prefijo, setPrefijo] = useState('GYM');

  // Logo upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Create user modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ nombre: '', email: '', password: '', rol: 'recepcionista' as string });
  const [creatingUser, setCreatingUser] = useState(false);
  const [userError, setUserError] = useState('');

  // Delete user confirm
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [empRes, usersRes] = await Promise.all([
        api.get('/empresas/me'),
        api.get('/empresas/users'),
      ]);
      setEmpresa(empRes.data);
      setNombre(empRes.data.nombre);
      setColor(empRes.data.colorPrimario || '#2b8a3e');
      setResolucion(empRes.data.resolucionFactura || '');
      setPrefijo(empRes.data.prefijoFactura || 'GYM');
      setUsers(usersRes.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const guardarEmpresa = async () => {
    setSaving(true);
    try {
      await api.put('/empresas/me', {
        nombre,
        colorPrimario: color,
        resolucionFactura: resolucion || undefined,
        prefijoFactura: prefijo,
      });
      const root = document.documentElement;
      root.style.setProperty('--brand', color);
      root.style.setProperty('--brand-strong', color);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
      if (result) {
        root.style.setProperty('--brand-rgb', `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`);
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const subirLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const { data } = await api.post('/empresas/logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await api.put('/empresas/me', { logoUrl: data.url, prefijoFactura: prefijo });
      setEmpresa((prev) => prev ? { ...prev, logoUrl: data.url } : prev);
    } catch {
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const crearUsuario = async () => {
    setCreatingUser(true);
    setUserError('');
    try {
      await api.post('/empresas/users', newUser);
      setUserModalOpen(false);
      setNewUser({ nombre: '', email: '', password: '', rol: 'recepcionista' });
      loadData();
    } catch (e: any) {
      setUserError(e.response?.data?.message || 'Error al crear usuario');
    } finally {
      setCreatingUser(false);
    }
  };

  const eliminarUsuario = async (id: string) => {
    try {
      await api.delete(`/empresas/users/${id}`);
      setDeleteUser(null);
      loadData();
    } catch {
    }
  };

  const rolLabel = (r: string) => r === 'super_admin' ? 'Super Admin' : r === 'admin' ? 'Administrador' : 'Recepcionista';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <i className="fa-solid fa-circle-notch fa-spin text-2xl" style={{ color: 'var(--brand)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>Configuracion del gimnasio</h1>

      {/* Logo + Info */}
      <div
        className="p-6 mb-6"
        style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}
      >
        <div className="flex items-start gap-6 mb-6">
          {/* Logo */}
          <div className="shrink-0">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white overflow-hidden"
              style={{ background: empresa?.logoUrl ? 'transparent' : color }}
            >
              {empresa?.logoUrl ? (
                <img src={empresa.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                nombre.charAt(0)
              )}
            </div>
            {isAdmin && (
              <>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={subirLogo} />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full text-xs mt-2 py-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--brand)', background: 'rgba(var(--brand-rgb),0.08)' }}
                >
                  {uploading ? 'Subiendo...' : 'Cambiar logo'}
                </button>
              </>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <label className="field-label">Nombre del gimnasio</label>
              <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={!isAdmin} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">NIT</label>
                <input className="input" value={empresa?.nit || ''} disabled />
              </div>
              <div>
                <label className="field-label">Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} disabled={!isAdmin} className="w-10 h-10 rounded-lg border cursor-pointer" style={{ borderColor: 'var(--border)' }} />
                  <input className="input" value={color} onChange={(e) => setColor(e.target.value)} disabled={!isAdmin} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="field-label">Resolucion facturacion</label>
            <input className="input" value={resolucion} onChange={(e) => setResolucion(e.target.value)} disabled={!isAdmin} placeholder="Opcional" />
          </div>
          <div>
            <label className="field-label">Prefijo factura</label>
            <input className="input" value={prefijo} onChange={(e) => setPrefijo(e.target.value)} disabled={!isAdmin} maxLength={10} />
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-end mt-5">
            <Button
              label={saving ? 'Guardando...' : 'Guardar cambios'}
              icon="pi pi-check"
              loading={saving}
              onClick={guardarEmpresa}
              className="!bg-[var(--brand)] !border-[var(--brand)] !text-white w-full sm:w-auto"
            />
          </div>
        )}
      </div>

      {/* Users */}
      {isAdmin && (
        <div
          className="p-6"
          style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Usuarios del gimnasio</h2>
            <Button
              label="Crear usuario"
              icon="pi pi-plus"
              size="small"
              onClick={() => setUserModalOpen(true)}
              className="!bg-[var(--brand)] !border-[var(--brand)] !text-white mt-2 sm:mt-0"
            />
          </div>

          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3"
                style={{ borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: u.rol === 'super_admin' ? '#7c3aed' : u.rol === 'admin' ? 'var(--brand)' : '#60a5fa' }}
                  >
                    {u.nombre.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{u.nombre}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{
                      background: u.rol === 'super_admin' ? 'rgba(124,58,237,0.1)' : u.rol === 'admin' ? 'rgba(var(--brand-rgb),0.08)' : 'rgba(96,165,250,0.1)',
                      color: u.rol === 'super_admin' ? '#7c3aed' : u.rol === 'admin' ? 'var(--brand)' : '#60a5fa',
                    }}
                  >
                    {rolLabel(u.rol)}
                  </span>
                  {u.rol !== 'super_admin' && (
                    <button
                      onClick={() => setDeleteUser(u)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                      style={{ color: '#d94a4a' }}
                    >
                      <i className="fa-solid fa-trash text-xs" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create user modal */}
      <Dialog
        header="Crear usuario"
        visible={userModalOpen}
        onHide={() => setUserModalOpen(false)}
        style={{ width: '92vw', maxWidth: '420px' }}
      >
        <div className="space-y-3 mt-2">
          {userError && (
            <div className="text-sm px-3 py-2 rounded-xl" style={{ background: 'rgba(217,74,74,0.08)', color: '#d94a4a' }}>
              {userError}
            </div>
          )}
          <div>
            <label className="field-label">Nombre</label>
            <input className="input" value={newUser.nombre} onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input className="input" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Contraseña</label>
            <input className="input" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Rol</label>
            <select className="input" value={newUser.rol} onChange={(e) => setNewUser({ ...newUser, rol: e.target.value })}>
              <option value="recepcionista">Recepcionista</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <Button label="Cancelar" severity="secondary" text onClick={() => setUserModalOpen(false)} className="w-full sm:w-auto" />
          <Button
            label={creatingUser ? 'Creando...' : 'Crear usuario'}
            icon="pi pi-check"
            loading={creatingUser}
            onClick={crearUsuario}
            disabled={!newUser.nombre || !newUser.email || newUser.password.length < 6}
            className="!bg-[var(--brand)] !border-[var(--brand)] !text-white w-full sm:w-auto"
          />
        </div>
      </Dialog>

      {/* Delete user confirm */}
      <Dialog
        header="Eliminar usuario"
        visible={!!deleteUser}
        onHide={() => setDeleteUser(null)}
        style={{ width: '92vw', maxWidth: '400px' }}
      >
        {deleteUser && (
          <div>
            <p className="text-sm mb-4" style={{ color: 'var(--text)' }}>
              Se eliminará a <strong>{deleteUser.nombre}</strong> ({deleteUser.email}).
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <Button label="Cancelar" severity="secondary" text onClick={() => setDeleteUser(null)} className="w-full sm:w-auto" />
              <Button label="Eliminar" icon="pi pi-trash" severity="danger" onClick={() => eliminarUsuario(deleteUser.id)} className="w-full sm:w-auto" />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
