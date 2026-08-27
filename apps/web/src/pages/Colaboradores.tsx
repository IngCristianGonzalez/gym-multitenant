import { useEffect, useState } from 'react';
import api from '../api/client';
import { offlineGet, offlineMutate } from '../offline/api-client';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import {
  Badge,
  EstadoBadge,
  PageHeader,
  SectionCard,
  StatCard,
  formatMoney,
} from '../components/ui';

interface Colaborador {
  id: string;
  nombre: string;
  identificacion?: string;
  celular?: string;
  cargo: string;
  estado: string;
  miembrosAsignados: number;
  produccionTotal: number;
  produccionMes: number;
}

interface Detalle extends Colaborador {
  asignaciones: Array<{
    id: string;
    fechaFin: string | null;
    miembro: { primerNombre: string; primerApellido: string };
    frecuencia: { nombre: string };
  }>;
}

const cargos = ['entrenador', 'recepcionista', 'administrativo', 'nutricionista'];
const cargoColor: Record<string, 'purple' | 'blue' | 'amber' | 'green'> = {
  entrenador: 'purple',
  recepcionista: 'blue',
  administrativo: 'amber',
  nutricionista: 'green',
};

const formInicial = { nombre: '', identificacion: '', celular: '', cargo: 'entrenador' };

const iniciales = (nombre: string) =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

export default function Colaboradores() {
  const [list, setList] = useState<Colaborador[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(formInicial);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);

  const load = () => {
    offlineGet('/colaboradores', { cacheKey: 'colaboradores' }).then((res) => setList(res.data)).catch(() => {});
  };

  useEffect(load, []);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await offlineMutate('POST', '/colaboradores', {
        nombre: form.nombre,
        cargo: form.cargo,
        ...(form.identificacion ? { identificacion: form.identificacion } : {}),
        ...(form.celular ? { celular: form.celular } : {}),
      });
      setForm(formInicial);
      setModalOpen(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'No se pudo crear el colaborador');
    } finally {
      setGuardando(false);
    }
  };

  const abrirDetalle = async (c: Colaborador) => {
    try {
      const res = await offlineGet(`/colaboradores/${c.id}`, { cacheKey: `colaborador:${c.id}` });
      setDetalle(res.data);
      setDetalleOpen(true);
    } catch {
      // If offline, show basic info
      setDetalle({ ...c, asignaciones: [] } as any);
      setDetalleOpen(true);
    }
  };

  const totalProduccion = list.reduce((acc, c) => acc + c.produccionTotal, 0);

  return (
    <div>
      <PageHeader
        title="Colaboradores"
        subtitle="Equipo del gimnasio, miembros asignados y su producción"
        actions={
          <button className="btn-hero" onClick={() => setModalOpen(true)}>
            <i className="fa-solid fa-user-plus" />
            Nuevo colaborador
          </button>
        }
      />

      <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 mb-4">
        <StatCard label="Colaboradores" value={list.length} icon="fa-people-group" tone="blue" />
        <StatCard label="Producción total" value={formatMoney(totalProduccion)} icon="fa-sack-dollar" tone="purple" />
        <StatCard
          label="Miembros asignados"
          value={list.reduce((acc, c) => acc + c.miembrosAsignados, 0)}
          icon="fa-users"
          tone="brand"
        />
      </div>

      {list.length === 0 ? (
        <SectionCard>
          <div className="text-center py-10 text-muted">
            <i className="fa-solid fa-people-group text-3xl mb-3 opacity-40" />
            <p>Sin colaboradores — agrega el primero</p>
          </div>
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {list.map((c) => (
            <div key={c.id} className="card card-hover p-4 animate-fade-up cursor-pointer" onClick={() => abrirDetalle(c)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-brand/10 text-brand font-bold flex items-center justify-center shrink-0 text-xs sm:text-sm">
                    {iniciales(c.nombre)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{c.nombre}</p>
                    <Badge color={cargoColor[c.cargo] ?? 'gray'}>{c.cargo}</Badge>
                  </div>
                </div>
                <EstadoBadge estado={c.estado} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-bg border border-border py-2">
                  <p className="text-lg font-bold tabular-nums leading-none">{c.miembrosAsignados}</p>
                  <p className="text-[11px] text-muted mt-1">Miembros</p>
                </div>
                <div className="rounded-lg bg-bg border border-border py-2">
                  <p className="text-sm font-bold tabular-nums leading-tight pt-0.5">{formatMoney(c.produccionMes)}</p>
                  <p className="text-[11px] text-muted mt-1">Producción mes</p>
                </div>
                <div className="rounded-lg bg-bg border border-border py-2">
                  <p className="text-sm font-bold tabular-nums leading-tight pt-0.5">{formatMoney(c.produccionTotal)}</p>
                  <p className="text-[11px] text-muted mt-1">Total</p>
                </div>
              </div>

              <button className="mt-3 w-full text-xs text-brand hover:underline flex items-center justify-center gap-1.5">
                Ver miembros asignados <i className="fa-solid fa-arrow-right text-[10px]" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal nuevo colaborador */}
      <Dialog
        header={
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
              <i className="fa-solid fa-user-plus text-sm" />
            </span>
            <span className="font-bold">Nuevo colaborador</span>
          </div>
        }
        visible={modalOpen}
        onHide={() => setModalOpen(false)}
        style={{ width: '92vw', maxWidth: '480px' }}
        breakpoints={{ '640px': '95vw' }}
      >
        <form onSubmit={crear}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="field-label">Nombre completo *</label>
              <input
                className="input"
                placeholder="Mínimo 3 caracteres"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                minLength={3}
              />
            </div>
            <div>
              <label className="field-label">Identificación</label>
              <input
                className="input"
                inputMode="numeric"
                placeholder="Solo números"
                value={form.identificacion}
                onChange={(e) =>
                  setForm({ ...form, identificacion: e.target.value.replace(/\D/g, '').slice(0, 15) })
                }
              />
            </div>
            <div>
              <label className="field-label">Celular</label>
              <input
                className="input"
                inputMode="numeric"
                maxLength={11}
                placeholder="3XX XXX XXXX"
                value={form.celular}
                onChange={(e) =>
                  setForm({ ...form, celular: e.target.value.replace(/\D/g, '').slice(0, 11) })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Cargo *</label>
              <select
                className="input"
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
              >
                {cargos.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6 pt-4 border-t border-border">
            <Button type="button" label="Cancelar" severity="secondary" text onClick={() => setModalOpen(false)} className="w-full sm:w-auto" />
            <Button
              type="submit"
              label={guardando ? 'Guardando…' : 'Guardar colaborador'}
              icon="pi pi-check"
              loading={guardando}
              className="w-full sm:w-auto"
            />
          </div>
        </form>
      </Dialog>

      {/* Modal detalle */}
      <Dialog
        header={
          detalle && (
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-brand/10 text-brand font-bold flex items-center justify-center text-xs">
                {iniciales(detalle.nombre)}
              </span>
              <div>
                <p className="font-bold leading-tight">{detalle.nombre}</p>
                <p className="text-xs text-muted font-normal capitalize">{detalle.cargo}</p>
              </div>
            </div>
          )
        }
        visible={detalleOpen}
        onHide={() => setDetalleOpen(false)}
        style={{ width: '92vw', maxWidth: '560px' }}
        breakpoints={{ '640px': '95vw' }}
      >
        {detalle && (
          <div>
            <h3 className="field-label">Miembros asignados ({detalle.asignaciones.length})</h3>
            {detalle.asignaciones.length === 0 ? (
              <p className="text-sm text-muted py-3">
                Sin miembros con rutina activa. Asigna rutinas desde el módulo Miembros.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {detalle.asignaciones.map((a) => {
                  const dias = a.fechaFin
                    ? Math.ceil((new Date(a.fechaFin).getTime() - Date.now()) / 86400000)
                    : null;
                  return (
                    <li key={a.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {a.miembro.primerNombre} {a.miembro.primerApellido}
                        </p>
                        <p className="text-xs text-muted">{a.frecuencia.nombre}</p>
                      </div>
                      <Badge color={dias !== null && dias <= 3 ? 'amber' : 'green'}>
                        {dias !== null ? `Vence en ${dias} d` : 'Activa'}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
