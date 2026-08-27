import { useState, useEffect } from 'react';
import api from '../api/client';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

interface Empresa {
  id: string;
  nombre: string;
  nit: string;
  logoUrl: string | null;
  colorPrimario: string;
  createdAt: string;
  _count: { users: number; miembros: number; facturas: number };
}

export default function SuperAdmin() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    nit: '',
    adminNombre: '',
    adminEmail: '',
    adminPassword: '',
    colorPrimario: '#2b8a3e',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Empresa | null>(null);

  useEffect(() => {
    loadEmpresas();
  }, []);

  const loadEmpresas = async () => {
    try {
      const { data } = await api.get('/empresas/all');
      setEmpresas(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const crearEmpresa = async () => {
    setSaving(true);
    setError('');
    try {
      await api.post('/empresas', form);
      setModalOpen(false);
      setForm({ nombre: '', nit: '', adminNombre: '', adminEmail: '', adminPassword: '', colorPrimario: '#2b8a3e' });
      loadEmpresas();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al crear');
    } finally {
      setSaving(false);
    }
  };

  const eliminarEmpresa = async (id: string) => {
    try {
      await api.delete(`/empresas/${id}`);
      setDeleteConfirm(null);
      loadEmpresas();
    } catch {
    }
  };

  const formatFecha = (s: string) => new Date(s).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Panel Super Admin</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Administra todos los gimnasios del sistema
          </p>
        </div>
        <Button
          label="Crear gimnasio"
          icon="pi pi-plus"
          onClick={() => setModalOpen(true)}
          className="!bg-[var(--brand)] !border-[var(--brand)] !text-white mt-2 sm:mt-0"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total gimnasios', value: empresas.length, icon: 'fa-building' },
          { label: 'Total usuarios', value: empresas.reduce((s, e) => s + e._count.users, 0), icon: 'fa-users' },
          { label: 'Total miembros', value: empresas.reduce((s, e) => s + e._count.miembros, 0), icon: 'fa-id-card' },
        ].map((s) => (
          <div
            key={s.label}
            className="p-4"
            style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(43,138,94,0.08)' }}
              >
                <i className={`fa-solid ${s.icon}`} style={{ color: 'var(--brand)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{s.value}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empresas list */}
      <div
        className="overflow-hidden"
        style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Gimnasio</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>NIT</th>
              <th className="text-center px-4 py-3 font-semibold" style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Usuarios</th>
              <th className="text-center px-4 py-3 font-semibold" style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Miembros</th>
              <th className="text-center px-4 py-3 font-semibold" style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Facturas</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Creado</th>
              <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((e) => (
              <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {e.logoUrl ? (
                      <img src={e.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: e.colorPrimario }}
                      >
                        {e.nombre.charAt(0)}
                      </div>
                    )}
                    <span className="font-semibold" style={{ color: 'var(--text)' }}>{e.nombre}</span>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{e.nit}</td>
                <td className="px-4 py-3 text-center" style={{ color: 'var(--text)' }}>{e._count.users}</td>
                <td className="px-4 py-3 text-center" style={{ color: 'var(--text)' }}>{e._count.miembros}</td>
                <td className="px-4 py-3 text-center" style={{ color: 'var(--text)' }}>{e._count.facturas}</td>
                <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{formatFecha(e.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setDeleteConfirm(e)}
                    className="p-2 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                    style={{ color: '#d94a4a' }}
                    title="Eliminar"
                  >
                    <i className="fa-solid fa-trash text-xs" />
                  </button>
                </td>
              </tr>
            ))}
            {empresas.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                  No hay gimnasios creados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      <Dialog
        header="Crear gimnasio"
        visible={modalOpen}
        onHide={() => setModalOpen(false)}
        style={{ width: '92vw', maxWidth: '480px' }}
      >
        <div className="space-y-4 mt-2">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Crea un nuevo gimnasio con su administrador
          </p>

          {error && (
            <div className="text-sm px-3 py-2 rounded-xl" style={{ background: 'rgba(217,74,74,0.08)', color: '#d94a4a' }}>
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="field-label">Nombre del gimnasio</label>
              <input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Mi Gimnasio" />
            </div>
            <div>
              <label className="field-label">NIT</label>
              <input className="input" value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value })} placeholder="900123456-7" />
            </div>
            <div>
              <label className="field-label">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.colorPrimario} onChange={(e) => setForm({ ...form, colorPrimario: e.target.value })} className="w-10 h-10 rounded-lg border cursor-pointer" style={{ borderColor: 'var(--border)' }} />
                <input className="input" value={form.colorPrimario} onChange={(e) => setForm({ ...form, colorPrimario: e.target.value })} />
              </div>
            </div>
            <div className="col-span-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Administrador del gimnasio</p>
            </div>
            <div className="col-span-2">
              <label className="field-label">Nombre</label>
              <input className="input" value={form.adminNombre} onChange={(e) => setForm({ ...form, adminNombre: e.target.value })} placeholder="Juan Perez" />
            </div>
            <div className="col-span-2">
              <label className="field-label">Email</label>
              <input className="input" type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} placeholder="admin@migym.com" />
            </div>
            <div className="col-span-2">
              <label className="field-label">Contrasena</label>
              <input className="input" type="password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} placeholder="Minimo 6 caracteres" />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <Button label="Cancelar" severity="secondary" text onClick={() => setModalOpen(false)} className="w-full sm:w-auto" />
          <Button
            label={saving ? 'Creando...' : 'Crear gimnasio'}
            icon="pi pi-check"
            loading={saving}
            onClick={crearEmpresa}
            disabled={!form.nombre || !form.nit || !form.adminNombre || !form.adminEmail || form.adminPassword.length < 6}
            className="!bg-[var(--brand)] !border-[var(--brand)] !text-white w-full sm:w-auto"
          />
        </div>
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        header="Eliminar gimnasio"
        visible={!!deleteConfirm}
        onHide={() => setDeleteConfirm(null)}
        style={{ width: '92vw', maxWidth: '400px' }}
      >
        {deleteConfirm && (
          <div>
            <p className="text-sm mb-4" style={{ color: 'var(--text)' }}>
              Se eliminara <strong>{deleteConfirm.nombre}</strong> y todos sus datos (usuarios, miembros, facturas). Esta accion no se puede deshacer.
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <Button label="Cancelar" severity="secondary" text onClick={() => setDeleteConfirm(null)} className="w-full sm:w-auto" />
              <Button
                label="Eliminar"
                icon="pi pi-trash"
                severity="danger"
                onClick={() => eliminarEmpresa(deleteConfirm.id)}
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
