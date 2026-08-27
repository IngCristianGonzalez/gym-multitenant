import { useEffect, useState, useMemo } from 'react';
import api from '../api/client';
import { offlineGet, offlineMutate } from '../offline/api-client';
import { useSync } from '../offline/sync-provider';
import { abrirPdfFactura } from '../api/pdf';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import {
  Badge,
  EstadoBadge,
  PageHeader,
  formatMoney,
} from '../components/ui';

interface Miembro {
  id: string;
  identificacion: string;
  primerNombre: string;
  primerApellido: string;
  celular: string;
  estado: string;
  rutinasAsignadas?: Array<{
    id: string;
    fechaFin: string | null;
    frecuencia?: { nombre: string };
  }>;
}

interface Rutina {
  id: string;
  nombre: string;
  duracionDias: number | null;
  precio: number;
}

interface Colaborador {
  id: string;
  nombre: string;
  cargo: string;
}

type Errores = Partial<Record<'identificacion' | 'primerNombre' | 'primerApellido' | 'celular', string>>;

const PAGE_SIZE = 16;

const validar = (form: typeof formInicial): Errores => {
  const e: Errores = {};
  if (!/^\d+$/.test(form.identificacion)) {
    e.identificacion = 'La identificación debe ser numérica';
  } else if (form.identificacion.length < 5 || form.identificacion.length > 15) {
    e.identificacion = 'Entre 5 y 15 dígitos';
  }
  if (form.primerNombre.trim().length < 3) {
    e.primerNombre = 'Mínimo 3 caracteres';
  }
  if (form.primerApellido.trim().length < 5) {
    e.primerApellido = 'Mínimo 5 caracteres';
  }
  if (!/^3\d{8,10}$/.test(form.celular)) {
    e.celular = 'Numérico, comienza por 3, máximo 11 dígitos';
  }
  return e;
};

const formInicial = {
  identificacion: '',
  primerNombre: '',
  primerApellido: '',
  celular: '',
};

export default function Miembros() {
  const [list, setList] = useState<Miembro[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const { queueWrite } = useSync();

  // ---- Modal nuevo miembro ----
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [form, setForm] = useState(formInicial);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [guardando, setGuardando] = useState(false);
  const [errorBackend, setErrorBackend] = useState('');

  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [frecuenciaId, setFrecuenciaId] = useState('');
  const [colaboradorId, setColaboradorId] = useState('');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [metodoPago, setMetodoPago] = useState('efectivo');

  const [registroOk, setRegistroOk] = useState<{
    facturaId: string;
    numeroFactura: string;
    total: number;
    nombre: string;
  } | null>(null);

  // ---- Modal asignar rutina ----
  const [asignOpen, setAsignOpen] = useState(false);
  const [miembroSel, setMiembroSel] = useState<Miembro | null>(null);
  const [asignaciones, setAsignaciones] = useState<any[]>([]);
  const [nueva, setNueva] = useState({ frecuenciaId: '', colaboradorId: '', fechaInicio: new Date().toISOString().split('T')[0] });
  const [asignError, setAsignError] = useState('');

  const load = () => {
    setLoading(true);
    offlineGet('/miembros', { params: { search }, cacheKey: `miembros:${search}` })
      .then((res) => setList(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);
  useEffect(() => { setPage(1); }, [search]);

  const errores = validar(form);
  const formValido = Object.keys(errores).length === 0 && frecuenciaId !== '';
  const rutinaSel = rutinas.find((r) => r.id === frecuenciaId);

  const filteredList = useMemo(() => {
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter(
      (m) =>
        m.primerNombre.toLowerCase().includes(s) ||
        m.primerApellido.toLowerCase().includes(s) ||
        m.identificacion.includes(s),
    );
  }, [list, search]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const pagedList = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredList.slice(start, start + PAGE_SIZE);
  }, [filteredList, page]);

  const abrirNuevo = async () => {
    setForm(formInicial);
    setTouched({});
    setErrorBackend('');
    setRegistroOk(null);
    setFrecuenciaId('');
    setColaboradorId('');
    setFechaInicio(new Date().toISOString().split('T')[0]);
    setMetodoPago('efectivo');
    setNuevoOpen(true);
    try {
      const [ruts, cols] = await Promise.all([api.get('/rutinas'), api.get('/colaboradores')]);
      setRutinas(ruts.data);
      setColaboradores(cols.data);
    } catch {
      setRutinas([]);
      setColaboradores([]);
    }
  };

  const marcarTodosTocados = () =>
    setTouched({ identificacion: true, primerNombre: true, primerApellido: true, celular: true });

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    marcarTodosTocados();
    setErrorBackend('');
    if (!formValido || !rutinaSel) return;
    setGuardando(true);
    try {
      const res = await offlineMutate<any>('POST', '/miembros/registro', {
        miembro: {
          ...form,
          tipoIdentificacion: 'CC',
          segundoApellido: '',
          fechaNacimiento: new Date().toISOString().split('T')[0],
          sexo: 'M',
        },
        frecuenciaId,
        fechaInicio,
        ...(colaboradorId ? { colaboradorId } : {}),
        metodoPago,
      });
      if (res?.data?.factura) {
        setRegistroOk({
          facturaId: res.data.factura.id,
          numeroFactura: res.data.factura.numeroFactura,
          total: res.data.factura.total,
          nombre: `${res.data.miembro.primerNombre} ${res.data.miembro.primerApellido}`,
        });
      } else {
        // Queued offline — show success
        setRegistroOk({
          facturaId: 'pending',
          numeroFactura: 'Pendiente',
          total: rutinaSel.precio,
          nombre: `${form.primerNombre} ${form.primerApellido}`,
        });
      }
      setForm(formInicial);
      load();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ??
        (Array.isArray(err.response?.data?.message)
          ? err.response.data.message[0]
          : null) ??
        'No se pudo registrar el miembro';
      setErrorBackend(typeof msg === 'string' ? msg : 'No se pudo registrar el miembro');
    } finally {
      setGuardando(false);
    }
  };

  const abrirAsignar = async (m: Miembro) => {
    setMiembroSel(m);
    setAsignOpen(true);
    setAsignError('');
    setNueva({ frecuenciaId: '', colaboradorId: '', fechaInicio: new Date().toISOString().split('T')[0] });
    try {
      const [ruts, asigs, cols] = await Promise.all([
        offlineGet('/rutinas', { cacheKey: 'rutinas' }),
        offlineGet('/rutinas/asignaciones', { params: { miembroId: m.id }, cacheKey: `asignaciones:${m.id}` }),
        offlineGet('/colaboradores', { cacheKey: 'colaboradores' }),
      ]);
      setRutinas(ruts.data);
      setAsignaciones(asigs.data);
      setColaboradores(cols.data);
    } catch {
      // Use cached data if available
    }
  };

  const asignar = async () => {
    if (!miembroSel || !nueva.frecuenciaId) return;
    setAsignError('');
    try {
      await offlineMutate('POST', '/rutinas/asignar', {
        miembroId: miembroSel.id,
        frecuenciaId: nueva.frecuenciaId,
        fechaInicio: nueva.fechaInicio,
        ...(nueva.colaboradorId ? { colaboradorId: nueva.colaboradorId } : {}),
      });
      try {
        const asigs = await offlineGet('/rutinas/asignaciones', { params: { miembroId: miembroSel.id }, cacheKey: `asignaciones:${miembroSel.id}` });
        setAsignaciones(asigs.data);
      } catch {
        // If offline, keep the current state
      }
      setNueva({ frecuenciaId: '', colaboradorId: '', fechaInicio: new Date().toISOString().split('T')[0] });
      load();
    } catch (err: any) {
      setAsignError(err.response?.data?.message ?? 'No se pudo asignar la rutina');
    }
  };

  const rutinaOptions = rutinas.map((r) => ({
    label: `${r.nombre} · ${r.duracionDias ?? '—'} días · ${formatMoney(r.precio)}`,
    value: r.id,
  }));
  const colaboradorOptions = colaboradores.map((c) => ({ label: `${c.nombre} (${c.cargo})`, value: c.id }));

  return (
    <div>
      <PageHeader
        title="Miembros"
        subtitle={`${filteredList.length} miembro(s)`}
        actions={
          <button className="btn-hero" onClick={abrirNuevo}>
            <i className="fa-solid fa-user-plus" />
            Nuevo miembro
          </button>
        }
      />

      <div className="mb-4 relative">
        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm" />
        <input
          className="input pl-9"
          placeholder="Buscar por nombre o identificación..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {pagedList.length === 0 ? (
        <div className="card p-8 text-center text-muted text-sm">
          {search ? 'Sin resultados para esta búsqueda' : 'Sin miembros — registra el primero con el botón verde'}
        </div>
      ) : (
        <>
          <div className="card-grid">
            {pagedList.map((m) => {
              const act = m.rutinasAsignadas?.[0];
              return (
                <div key={m.id} className="card-item">
                  <div className="card-item-header">
                    <div className="min-w-0 flex-1">
                      <p className="card-item-name">{m.primerNombre} {m.primerApellido}</p>
                      <p className="card-item-sub">CC {m.identificacion}</p>
                    </div>
                    <EstadoBadge estado={m.estado} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <i className="fa-solid fa-phone text-[10px]" />
                    {m.celular}
                  </div>
                  <div className="card-item-footer">
                    {act ? (
                      <Badge color="purple">{act.frecuencia?.nombre}</Badge>
                    ) : (
                      <span className="text-xs text-muted">Sin rutina</span>
                    )}
                    <Button
                      icon="pi pi-calendar-plus"
                      size="small"
                      severity="secondary"
                      outlined
                      rounded
                      tooltip="Renovar / asignar rutina"
                      tooltipOptions={{ position: 'top' }}
                      onClick={() => abrirAsignar(m)}
                    />
                  </div>
                </div>
              );
            })}
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

      {/* ================= Modal nuevo miembro ================= */}
      <Dialog
        header={
          registroOk ? undefined : (
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                <i className="fa-solid fa-user-plus text-sm" />
              </span>
              <div>
                <p className="font-bold leading-tight">Nuevo miembro</p>
                <p className="text-xs text-muted font-normal">Registro + rutina + factura en un solo paso</p>
              </div>
            </div>
          )
        }
        visible={nuevoOpen}
        onHide={() => setNuevoOpen(false)}
        style={{ width: '92vw', maxWidth: '640px' }}
        breakpoints={{ '960px': '92vw', '640px': '95vw' }}
        pt={{ content: { className: 'pt-2' } }}
      >
        {registroOk ? (
          /* ---- Vista de éxito con factura emitida ---- */
          <div className="text-center py-4 animate-fade-up">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center mb-4">
              <i className="fa-solid fa-check text-2xl text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold">{registroOk.nombre} registrado</h3>
            <p className="text-sm text-muted mt-1">
              Rutina asignada y factura <strong>{registroOk.numeroFactura}</strong> emitida por{' '}
              <strong>{formatMoney(registroOk.total)}</strong>
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2 mt-5">
              <Button
                label="Ver factura PDF"
                icon="pi pi-file-pdf"
                onClick={() => abrirPdfFactura(registroOk.facturaId)}
                className="w-full sm:w-auto"
              />
              <Button
                label="Cerrar"
                severity="secondary"
                text
                onClick={() => setNuevoOpen(false)}
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        ) : (
          <form onSubmit={crear} noValidate>
            {/* Datos personales */}
            <p className="field-label !mb-2 flex items-center gap-1.5">
              <i className="fa-solid fa-id-card text-brand" /> Datos personales
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="field-label">Identificación *</label>
                <input
                  className={`input ${touched.identificacion && errores.identificacion ? 'input-error' : ''}`}
                  placeholder="Solo números"
                  inputMode="numeric"
                  value={form.identificacion}
                  onChange={(e) =>
                    setForm({ ...form, identificacion: e.target.value.replace(/\D/g, '') })
                  }
                  onBlur={() => setTouched({ ...touched, identificacion: true })}
                />
                {touched.identificacion && errores.identificacion && (
                  <p className="field-error"><i className="fa-solid fa-circle-exclamation" />{errores.identificacion}</p>
                )}
              </div>
              <div>
                <label className="field-label">Celular *</label>
                <input
                  className={`input ${touched.celular && errores.celular ? 'input-error' : ''}`}
                  placeholder="3XX XXX XXXX (hasta 11 dígitos)"
                  inputMode="numeric"
                  maxLength={11}
                  value={form.celular}
                  onChange={(e) =>
                    setForm({ ...form, celular: e.target.value.replace(/\D/g, '').slice(0, 11) })
                  }
                  onBlur={() => setTouched({ ...touched, celular: true })}
                />
                {touched.celular && errores.celular && (
                  <p className="field-error"><i className="fa-solid fa-circle-exclamation" />{errores.celular}</p>
                )}
              </div>
              <div>
                <label className="field-label">Primer nombre *</label>
                <input
                  className={`input ${touched.primerNombre && errores.primerNombre ? 'input-error' : ''}`}
                  placeholder="Mínimo 3 caracteres"
                  value={form.primerNombre}
                  onChange={(e) => setForm({ ...form, primerNombre: e.target.value })}
                  onBlur={() => setTouched({ ...touched, primerNombre: true })}
                />
                {touched.primerNombre && errores.primerNombre && (
                  <p className="field-error"><i className="fa-solid fa-circle-exclamation" />{errores.primerNombre}</p>
                )}
              </div>
              <div>
                <label className="field-label">Primer apellido *</label>
                <input
                  className={`input ${touched.primerApellido && errores.primerApellido ? 'input-error' : ''}`}
                  placeholder="Mínimo 5 caracteres"
                  value={form.primerApellido}
                  onChange={(e) => setForm({ ...form, primerApellido: e.target.value })}
                  onBlur={() => setTouched({ ...touched, primerApellido: true })}
                />
                {touched.primerApellido && errores.primerApellido && (
                  <p className="field-error"><i className="fa-solid fa-circle-exclamation" />{errores.primerApellido}</p>
                )}
              </div>
            </div>

            {/* Membresía */}
            <p className="field-label !mb-2 mt-5 flex items-center gap-1.5">
              <i className="fa-solid fa-dumbbell text-brand" /> Membresía
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="field-label">Rutina / Plan *</label>
                <Dropdown
                  value={frecuenciaId}
                  options={rutinaOptions}
                  onChange={(e) => setFrecuenciaId(e.value)}
                  placeholder="Selecciona la rutina a facturar"
                  filter
                  className="w-full"
                  emptyMessage="Crea primero una rutina en el módulo Rutinas"
                />
              </div>
              <div>
                <label className="field-label">Fecha inicio</label>
                <input
                  type="date"
                  className="input"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">Método de pago</label>
                <select className="input" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Colaborador asignado (opcional)</label>
                <Dropdown
                  value={colaboradorId}
                  options={colaboradorOptions}
                  onChange={(e) => setColaboradorId(e.value)}
                  placeholder="Entrenador / nutricionista responsable"
                  showClear
                  filter
                  className="w-full"
                />
              </div>
            </div>

            {/* Resumen */}
            <div className="mt-4 rounded-xl border border-border bg-bg p-3 flex items-center justify-between">
              <div className="text-sm text-muted">
                Total a pagar
                {rutinaSel && (
                  <span className="block text-xs">
                    {rutinaSel.nombre} · {rutinaSel.duracionDias ?? '—'} días
                  </span>
                )}
              </div>
              <span className="text-xl font-bold tabular-nums text-brand">
                {rutinaSel ? formatMoney(rutinaSel.precio) : '—'}
              </span>
            </div>

            {errorBackend && (
              <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm px-3 py-2 flex items-start gap-2">
                <i className="fa-solid fa-circle-exclamation mt-0.5" />
                {errorBackend}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6 pt-4 border-t border-border">
              <Button type="button" label="Cancelar" severity="secondary" text onClick={() => setNuevoOpen(false)} className="w-full sm:w-auto" />
              <Button
                type="submit"
                label={guardando ? 'Registrando…' : 'Registrar y facturar'}
                icon="pi pi-check"
                disabled={!formValido || guardando}
                loading={guardando}
                className="w-full sm:w-auto"
              />
            </div>
          </form>
        )}
      </Dialog>

      {/* ================= Modal asignar rutina ================= */}
      <Dialog
        header={miembroSel ? `Renovar rutina — ${miembroSel.primerNombre} ${miembroSel.primerApellido}` : 'Renovar rutina'}
        visible={asignOpen}
        onHide={() => setAsignOpen(false)}
        style={{ width: '92vw', maxWidth: '640px' }}
        breakpoints={{ '960px': '92vw', '640px': '95vw' }}
      >
        {miembroSel && (
          <div className="flex flex-col gap-4">
            <section>
              <h3 className="field-label">Rutinas actuales</h3>
              {asignaciones.length === 0 ? (
                <p className="text-muted text-sm">Sin rutinas asignadas.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {asignaciones.map((a: any) => {
                    const dias = a.fechaFin
                      ? Math.ceil((new Date(a.fechaFin).getTime() - Date.now()) / 86400000)
                      : null;
                    const activa = dias !== null && dias >= 0;
                    return (
                      <li key={a.id} className="flex items-center justify-between bg-bg border border-border rounded-lg p-2.5">
                        <div>
                          <p className="text-sm font-medium">{a.frecuencia?.nombre}</p>
                          {a.colaborador && (
                            <p className="text-xs text-muted">{a.colaborador.nombre}</p>
                          )}
                        </div>
                        <Badge color={activa ? 'green' : 'gray'}>
                          {activa ? `Vence en ${dias} días` : 'Finalizada'}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="border-t border-border pt-4">
              <h3 className="field-label">Asignar nueva rutina</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Dropdown
                    value={nueva.frecuenciaId}
                    options={rutinaOptions}
                    onChange={(e) => setNueva({ ...nueva, frecuenciaId: e.value })}
                    placeholder="Seleccionar rutina"
                    filter
                    className="w-full"
                  />
                </div>
                <Dropdown
                  value={nueva.colaboradorId}
                  options={colaboradorOptions}
                  onChange={(e) => setNueva({ ...nueva, colaboradorId: e.value })}
                  placeholder="Colaborador (opcional)"
                  showClear
                  className="w-full"
                />
                <input
                  type="date"
                  className="input"
                  value={nueva.fechaInicio}
                  onChange={(e) => setNueva({ ...nueva, fechaInicio: e.target.value })}
                />
              </div>
              {asignError && (
                <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm px-3 py-2 flex items-start gap-2">
                  <i className="fa-solid fa-triangle-exclamation mt-0.5" />
                  {asignError}
                </div>
              )}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-4 pt-4 border-t border-border">
                <Button
                  type="button"
                  label="Cancelar"
                  severity="secondary"
                  text
                  onClick={() => setAsignOpen(false)}
                  className="w-full sm:w-auto"
                />
                <Button
                  label="Asignar rutina"
                  icon="pi pi-check"
                  onClick={asignar}
                  disabled={!nueva.frecuenciaId}
                  className="w-full sm:w-auto"
                />
              </div>
            </section>
          </div>
        )}
      </Dialog>
    </div>
  );
}
