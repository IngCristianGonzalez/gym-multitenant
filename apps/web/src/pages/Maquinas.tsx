import { useEffect, useState } from 'react';
import api from '../api/client';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import {
  Badge,
  EstadoBadge,
  PageHeader,
  SectionCard,
  StatCard,
} from '../components/ui';

interface Maquina {
  id: string;
  nombre: string;
  tipo: string;
  marca?: string;
  modelo?: string;
  serial?: string;
  ubicacion?: string;
  estado: string;
}

const tipoInfo: Record<string, { icon: string; label: string; color: 'purple' | 'blue' | 'gray' }> = {
  fuerza: { icon: 'fa-dumbbell', label: 'Fuerza', color: 'purple' },
  cardio: { icon: 'fa-heart-pulse', label: 'Cardio', color: 'blue' },
  accesorio: { icon: 'fa-gear', label: 'Accesorio', color: 'gray' },
};

const formInicial = { nombre: '', tipo: 'fuerza', marca: '', ubicacion: '', serial: '' };

export default function Maquinas() {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(formInicial);

  const load = () => api.get('/maquinas').then((res) => setMaquinas(res.data));

  useEffect(() => { load(); }, []);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/maquinas', form);
    setForm(formInicial);
    setModalOpen(false);
    load();
  };

  const cambiarEstado = async (id: string, estado: string) => {
    await api.put(`/maquinas/${id}/estado`, { estado });
    load();
  };

  const conteo = (estado: string) => maquinas.filter((m) => m.estado === estado).length;

  return (
    <div>
      <PageHeader
        title="Equipamiento"
        subtitle="Estado de máquinas y accesorios del gimnasio"
        actions={
          <button className="btn-hero" onClick={() => setModalOpen(true)}>
            <i className="fa-solid fa-plus" />
            Nueva máquina
          </button>
        }
      />

      <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 mb-4">
        <StatCard label="Operativas" value={conteo('operativo')} icon="fa-circle-check" tone="brand" />
        <StatCard label="En mantenimiento" value={conteo('mantenimiento')} icon="fa-screwdriver-wrench" tone="amber" />
        <StatCard label="Fuera de servicio" value={conteo('fuera')} icon="fa-circle-xmark" tone="red" />
      </div>

      {maquinas.length === 0 ? (
        <SectionCard>
          <div className="text-center py-10 text-muted">
            <i className="fa-solid fa-dumbbell text-3xl mb-3 opacity-40" />
            <p>Sin máquinas registradas</p>
          </div>
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {maquinas.map((m) => {
            const info = tipoInfo[m.tipo] ?? tipoInfo.accesorio;
            return (
              <div key={m.id} className="card card-hover p-4 animate-fade-up">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                      <i className={`fa-solid ${info.icon} text-lg`} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{m.nombre}</p>
                      <p className="text-xs text-muted truncate">
                        {[m.marca, m.modelo].filter(Boolean).join(' · ') || 'Sin marca'}
                      </p>
                    </div>
                  </div>
                  <EstadoBadge estado={m.estado} />
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-muted">
                  <Badge color={info.color}>
                    <i className={`fa-solid ${info.icon}`} /> {info.label}
                  </Badge>
                  {m.ubicacion && (
                    <span className="inline-flex items-center gap-1 border border-border rounded-full px-2 py-0.5">
                      <i className="fa-solid fa-location-dot" /> {m.ubicacion}
                    </span>
                  )}
                  {m.serial && (
                    <span className="inline-flex items-center gap-1 border border-border rounded-full px-2 py-0.5 font-mono">
                      #{m.serial}
                    </span>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <label className="text-xs text-muted block mb-1">Cambiar estado</label>
                  <select
                    className="input !py-1.5 text-sm"
                    value={m.estado}
                    onChange={(e) => cambiarEstado(m.id, e.target.value)}
                  >
                    <option value="operativo">Operativo</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="fuera">Fuera de servicio</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal nueva máquina */}
      <Dialog
        header={
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
              <i className="fa-solid fa-dumbbell text-sm" />
            </span>
            <span className="font-bold">Nueva máquina</span>
          </div>
        }
        visible={modalOpen}
        onHide={() => setModalOpen(false)}
        style={{ width: '92vw', maxWidth: '520px' }}
        breakpoints={{ '640px': '95vw' }}
      >
        <form onSubmit={crear}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="field-label">Nombre *</label>
              <input
                className="input"
                placeholder="Ej. Press de banca"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="field-label">Tipo</label>
              <select
                className="input"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                <option value="fuerza">Fuerza</option>
                <option value="cardio">Cardio</option>
                <option value="accesorio">Accesorio</option>
              </select>
            </div>
            <div>
              <label className="field-label">Marca</label>
              <input
                className="input"
                placeholder="Ej. Life Fitness"
                value={form.marca}
                onChange={(e) => setForm({ ...form, marca: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Ubicación</label>
              <input
                className="input"
                placeholder="Ej. Sala de pesas"
                value={form.ubicacion}
                onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Serial</label>
              <input
                className="input"
                placeholder="Ej. MK-002"
                value={form.serial}
                onChange={(e) => setForm({ ...form, serial: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <Button type="button" label="Cancelar" severity="secondary" text onClick={() => setModalOpen(false)} />
            <Button type="submit" label="Guardar" icon="pi pi-check" className="!bg-brand !border-brand" />
          </div>
        </form>
      </Dialog>
    </div>
  );
}
