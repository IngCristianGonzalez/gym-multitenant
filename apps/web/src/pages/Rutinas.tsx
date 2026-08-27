import { useEffect, useState, useMemo } from 'react';
import api from '../api/client';
import { offlineGet, offlineMutate } from '../offline/api-client';
import { Button } from 'primereact/button';
import {
  Badge,
  PageHeader,
  SectionCard,
  formatMoney,
} from '../components/ui';

interface Rutina {
  id: string;
  nombre: string;
  tipoPeriodo: string;
  duracionDias: number | null;
  precio: number;
  descripcion?: string;
  ejercicios: any[];
}

const periodos = [
  { label: 'Día (1)', value: 'DIA', dias: 1 },
  { label: 'Semana (7)', value: 'SEMANA', dias: 7 },
  { label: 'Quincena (15)', value: 'QUINCENA', dias: 15 },
  { label: 'Mes (30)', value: 'MES', dias: 30 },
  { label: 'Personalizado', value: 'PERSONALIZADO', dias: null },
];

const formInicial = {
  nombre: '',
  tipoPeriodo: 'QUINCENA',
  descripcion: '',
  precio: '',
};

export default function Rutinas() {
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [form, setForm] = useState(formInicial);
  const [diasPersonalizado, setDiasPersonalizado] = useState('15');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const load = () => {
    offlineGet('/rutinas', { cacheKey: 'rutinas' }).then((res) => setRutinas(res.data)).catch(() => {});
  };

  useEffect(load, []);

  const periodoSel = periodos.find((p) => p.value === form.tipoPeriodo)!;
  const esPersonalizado = form.tipoPeriodo === 'PERSONALIZADO';
  const diasNum = parseInt(diasPersonalizado) || 0;
  const diasValidos = !esPersonalizado || (diasNum >= 1 && diasNum <= 30);
  const precioNum = parseFloat(form.precio);
  const formValido =
    form.nombre.trim().length >= 2 &&
    diasValidos &&
    !Number.isNaN(precioNum) &&
    precioNum >= 0;

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formValido) return;
    setGuardando(true);
    try {
      await offlineMutate('POST', '/rutinas', {
        nombre: form.nombre,
        tipoPeriodo: form.tipoPeriodo,
        descripcion: form.descripcion,
        precio: precioNum,
        duracionDias: esPersonalizado ? diasNum : periodoSel.dias,
        ejercicios: [],
      });
      setForm(formInicial);
      setDiasPersonalizado('15');
      load();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'No se pudo crear la rutina');
    } finally {
      setGuardando(false);
    }
  };

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const totalPages = Math.max(1, Math.ceil(rutinas.length / PAGE_SIZE));
  const pagedList = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rutinas.slice(start, start + PAGE_SIZE);
  }, [rutinas, page]);

  return (
    <div>
      <PageHeader
        title="Rutinas"
        subtitle="Catálogo de rutinas — se asignan desde el registro de cada miembro"
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Crear rutina */}
        <SectionCard title="Crear rutina" className="lg:col-span-2">
          <form onSubmit={crear} className="flex flex-col gap-3">
            <div>
              <label className="field-label">Nombre *</label>
              <input
                className="input"
                placeholder="Ej. Rutina Quincenal Fuerza"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="field-label">Periodo *</label>
              <select
                className="input"
                value={form.tipoPeriodo}
                onChange={(e) => setForm({ ...form, tipoPeriodo: e.target.value })}
              >
                {periodos.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {esPersonalizado && (
              <div className="animate-fade-up">
                <label className="field-label">Duración en días calendario (1-30) *</label>
                <input
                  className={`input ${diasPersonalizado !== '' && !diasValidos ? 'input-error' : ''}`}
                  type="number"
                  min={1}
                  max={30}
                  value={diasPersonalizado}
                  onChange={(e) => setDiasPersonalizado(e.target.value)}
                />
                {!diasValidos && (
                  <p className="field-error">
                    <i className="fa-solid fa-circle-exclamation" />
                    Indica entre 1 y 30 días
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="field-label">Precio *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                <input
                  className="input pl-7"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: e.target.value })}
                  required
                />
              </div>
              <p className="text-xs text-muted mt-1">
                Este es el valor que se factura al asignar la rutina a un miembro.
              </p>
            </div>

            <div>
              <label className="field-label">Descripción</label>
              <textarea
                className="input min-h-[70px] resize-y"
                placeholder="Objetivo, nivel, notas…"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm px-3 py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              label={guardando ? 'Creando…' : 'Crear rutina'}
              icon="pi pi-plus"
              disabled={!formValido || guardando}
              loading={guardando}
              className="w-full sm:w-auto mt-2"
            />
          </form>
        </SectionCard>

        {/* Catálogo */}
        <SectionCard
          title={`Rutinas disponibles (${rutinas.length})`}
          className="lg:col-span-3"
        >
          {pagedList.length === 0 ? (
            <p className="text-muted text-sm text-center py-6">Sin rutinas — crea la primera</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {pagedList.map((r) => (
                  <div key={r.id} className="card card-hover p-4 animate-fade-up">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-semibold text-sm truncate">{r.nombre}</p>
                      <Badge color="blue">
                        {r.tipoPeriodo} · {r.duracionDias ?? '—'} días
                      </Badge>
                    </div>
                    {r.descripcion && (
                      <p className="text-xs text-muted mb-2 line-clamp-2">{r.descripcion}</p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-base font-bold tabular-nums text-brand">
                        {formatMoney(r.precio)}
                      </span>
                      <span className="text-xs text-muted">
                        {r.ejercicios.length} ejercicio{r.ejercicios.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <Button
                    icon="pi pi-chevron-left"
                    size="small"
                    text
                    rounded
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  />
                  <span className="text-sm text-muted tabular-nums">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    icon="pi pi-chevron-right"
                    size="small"
                    text
                    rounded
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  />
                </div>
              )}
            </>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
