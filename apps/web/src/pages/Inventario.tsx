import { useEffect, useState, useMemo } from 'react';
import api from '../api/client';
import { offlineGet, offlineMutate } from '../offline/api-client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import {
  Badge,
  EstadoBadge,
  PageHeader,
  SectionCard,
  StatCard,
  formatMoney,
} from '../components/ui';

interface Producto {
  id: string;
  nombre: string;
  precioVenta: number;
  precioCompra: number;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: string;
}

const formProductoInicial = {
  nombre: '',
  precioCompra: '',
  precioVenta: '',
  stockActual: '',
  stockMinimo: '',
  unidadMedida: 'unidad',
};

const PAGE_SIZE = 16;

export default function Inventario() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [page, setPage] = useState(1);

  // Modal nuevo producto
  const [productoOpen, setProductoOpen] = useState(false);
  const [form, setForm] = useState(formProductoInicial);

  // Modal movimiento (entrada/salida)
  const [movOpen, setMovOpen] = useState(false);
  const [movTipo, setMovTipo] = useState<'entrada' | 'salida'>('entrada');
  const [movProducto, setMovProducto] = useState<Producto | null>(null);
  const [movCantidad, setMovCantidad] = useState('');
  const [movMotivo, setMovMotivo] = useState('compra');
  const [movError, setMovError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const load = () => {
    offlineGet('/inventario/productos', { cacheKey: 'inventario:productos' }).then((res) => setProductos(res.data)).catch(() => {});
    offlineGet('/inventario/movimientos', { cacheKey: 'inventario:movimientos' }).then((res) => setMovimientos(res.data)).catch(() => {});
    offlineGet('/inventario/categorias', { cacheKey: 'inventario:categorias' }).then((res) => setCategorias(res.data)).catch(() => {});
  };

  useEffect(load, []);

  // ---- Métricas ----
  const valorInventario = productos.reduce(
    (acc, p) => acc + p.precioCompra * p.stockActual,
    0,
  );
  const bajoStock = productos.filter((p) => p.stockActual < p.stockMinimo).length;

  // ---- Nuevo producto ----
  const compra = parseFloat(form.precioCompra) || 0;
  const venta = parseFloat(form.precioVenta) || 0;
  const margenNuevo = venta - compra;
  const margenPctNuevo = compra > 0 ? (margenNuevo / compra) * 100 : 0;
  const productoValido =
    form.nombre.trim().length >= 2 && venta > 0 && compra >= 0 && form.stockActual !== '';

  const crearProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoValido || !categorias[0]) return;
    await offlineMutate('POST', '/inventario/productos', {
      ...form,
      categoriaId: categorias[0].id,
      precioVenta: venta,
      precioCompra: compra,
      stockActual: parseInt(form.stockActual) || 0,
      stockMinimo: parseInt(form.stockMinimo) || 0,
    });
    setForm(formProductoInicial);
    setProductoOpen(false);
    load();
  };

  // ---- Movimientos ----
  const abrirMovimiento = (p: Producto, tipo: 'entrada' | 'salida') => {
    setMovProducto(p);
    setMovTipo(tipo);
    setMovCantidad('');
    setMovMotivo(tipo === 'entrada' ? 'compra' : 'venta');
    setMovError('');
    setMovOpen(true);
  };

  const cantidadNum = parseInt(movCantidad) || 0;
  const stockResultante = movProducto
    ? movTipo === 'entrada'
      ? movProducto.stockActual + cantidadNum
      : movProducto.stockActual - cantidadNum
    : 0;
  const movValido =
    Number.isInteger(cantidadNum) &&
    cantidadNum > 0 &&
    (movTipo === 'entrada' || cantidadNum <= (movProducto?.stockActual ?? 0));

  const confirmarMovimiento = async () => {
    if (!movProducto || !movValido) return;
    setGuardando(true);
    try {
      await offlineMutate('POST', '/inventario/movimientos', {
        productoId: movProducto.id,
        tipo: movTipo,
        cantidad: cantidadNum,
        motivo: movMotivo,
      });
      setMovOpen(false);
      load();
    } catch (err: any) {
      setMovError(err.response?.data?.message ?? 'No se pudo registrar el movimiento');
    } finally {
      setGuardando(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(productos.length / PAGE_SIZE));
  const pagedList = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return productos.slice(start, start + PAGE_SIZE);
  }, [productos, page]);

  return (
    <div>
      <PageHeader
        title="Inventario Consumibles"
        subtitle="Nevera y productos de venta con control de márgenes"
        actions={
          <button className="btn-hero" onClick={() => setProductoOpen(true)}>
            <i className="fa-solid fa-plus" />
            Nuevo producto
          </button>
        }
      />

      <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 mb-4">
        <StatCard label="Productos" value={productos.length} icon="fa-boxes-stacked" tone="blue" />
        <StatCard
          label="Valor inventario (compra)"
          value={formatMoney(valorInventario)}
          icon="fa-sack-dollar"
          tone="purple"
        />
        <StatCard
          label="Bajo mínimo"
          value={bajoStock}
          icon="fa-triangle-exclamation"
          tone={bajoStock > 0 ? 'amber' : 'brand'}
        />
      </div>

      <SectionCard title="Productos">
        {pagedList.length === 0 ? (
          <p className="text-muted text-sm text-center py-4">Sin productos — agrega el primero</p>
        ) : (
          <>
            <div className="card-grid">
              {pagedList.map((p) => {
                const margen = p.precioVenta - p.precioCompra;
                const pct = p.precioCompra > 0 ? (margen / p.precioCompra) * 100 : 0;
                const lowStock = p.stockActual < p.stockMinimo;
                return (
                  <div key={p.id} className="card-item">
                    <div className="card-item-header">
                      <div className="min-w-0 flex-1">
                        <p className="card-item-name">{p.nombre}</p>
                        <p className="card-item-sub">{p.unidadMedida}</p>
                      </div>
                      {lowStock && <Badge color="red">Bajo mín</Badge>}
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <div>
                        <span className="text-muted">Stock</span>
                        <span className={`ml-1 font-semibold tabular-nums ${lowStock ? 'text-red-500' : ''}`}>
                          {p.stockActual}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted">Margen</span>
                        <Badge color={margen > 0 ? 'green' : margen === 0 ? 'gray' : 'red'}>
                          {pct.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="card-item-footer">
                      <span className="text-xs text-muted">
                        {formatMoney(p.precioCompra)} → {formatMoney(p.precioVenta)}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          icon="fa-solid fa-arrow-down"
                          size="small"
                          severity="success"
                          outlined
                          rounded
                          tooltip="Ingreso"
                          tooltipOptions={{ position: 'top' }}
                          onClick={() => abrirMovimiento(p, 'entrada')}
                        />
                        <Button
                          icon="fa-solid fa-arrow-up"
                          size="small"
                          severity="danger"
                          outlined
                          rounded
                          tooltip="Salida"
                          tooltipOptions={{ position: 'top' }}
                          disabled={p.stockActual <= 0}
                          onClick={() => abrirMovimiento(p, 'salida')}
                        />
                      </div>
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
      </SectionCard>

      <SectionCard title="Últimos movimientos" className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted uppercase tracking-wide">
                <th className="py-2 px-2">Producto</th>
                <th className="py-2 px-2">Tipo</th>
                <th className="py-2 px-2">Cantidad</th>
                <th className="py-2 px-2">Motivo</th>
                <th className="py-2 px-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.slice(0, 50).length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">Sin movimientos</td>
                </tr>
              ) : (
                movimientos.slice(0, 50).map((m) => (
                  <tr key={m.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 px-2 font-medium">{m.producto?.nombre}</td>
                    <td className="py-2 px-2">
                      <EstadoBadge estado={m.tipo} label={m.tipo === 'entrada' ? 'Entrada' : 'Salida'} />
                    </td>
                    <td className="py-2 px-2 tabular-nums">{m.cantidad}</td>
                    <td className="py-2 px-2 text-muted">{m.motivo}</td>
                    <td className="py-2 px-2 text-muted">{new Date(m.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ============ Modal nuevo producto ============ */}
      <Dialog
        header={
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
              <i className="fa-solid fa-cart-plus text-sm" />
            </span>
            <span className="font-bold">Nuevo producto</span>
          </div>
        }
        visible={productoOpen}
        onHide={() => setProductoOpen(false)}
        style={{ width: '92vw', maxWidth: '520px' }}
        breakpoints={{ '640px': '95vw' }}
      >
        <form onSubmit={crearProducto}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="field-label">Nombre *</label>
              <input
                className="input"
                placeholder="Ej. Gaseosa 500ml"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="field-label">Precio compra *</label>
              <input
                className="input"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={form.precioCompra}
                onChange={(e) => setForm({ ...form, precioCompra: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="field-label">Precio venta *</label>
              <input
                className="input"
                type="number"
                min="1"
                step="any"
                placeholder="0"
                value={form.precioVenta}
                onChange={(e) => setForm({ ...form, precioVenta: e.target.value })}
                required
              />
            </div>
            {/* Margen en tiempo real */}
            <div className="sm:col-span-2 rounded-xl border border-border bg-bg p-3 flex items-center justify-between">
              <span className="text-sm text-muted">Margen de utilidad</span>
              <Badge color={margenNuevo > 0 ? 'green' : margenNuevo === 0 ? 'gray' : 'red'}>
                {formatMoney(margenNuevo)} · {margenPctNuevo.toFixed(0)}%
              </Badge>
            </div>
            <div>
              <label className="field-label">Stock inicial</label>
              <input
                className="input"
                type="number"
                min="0"
                placeholder="0"
                value={form.stockActual}
                onChange={(e) => setForm({ ...form, stockActual: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="field-label">Stock mínimo</label>
              <input
                className="input"
                type="number"
                min="0"
                placeholder="0"
                value={form.stockMinimo}
                onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Unidad de medida</label>
              <select
                className="input"
                value={form.unidadMedida}
                onChange={(e) => setForm({ ...form, unidadMedida: e.target.value })}
              >
                <option value="unidad">Unidad</option>
                <option value="kg">Kilogramo</option>
                <option value="litro">Litro</option>
                <option value="paquete">Paquete</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6 pt-4 border-t border-border">
            <Button type="button" label="Cancelar" severity="secondary" text onClick={() => setProductoOpen(false)} className="w-full sm:w-auto" />
            <Button
              type="submit"
              label="Guardar producto"
              icon="pi pi-check"
              disabled={!productoValido}
              className="w-full sm:w-auto"
            />
          </div>
        </form>
      </Dialog>

      {/* ============ Modal movimiento ============ */}
      <Dialog
        header={
          <div className="flex items-center gap-2">
            <span
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                movTipo === 'entrada'
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15'
                  : 'bg-red-100 text-red-600 dark:bg-red-500/15'
              }`}
            >
              <i className={`fa-solid ${movTipo === 'entrada' ? 'fa-arrow-down' : 'fa-arrow-up'} text-sm`} />
            </span>
            <div>
              <p className="font-bold leading-tight">
                {movTipo === 'entrada' ? 'Ingreso de mercancía' : 'Salida de inventario'}
              </p>
              <p className="text-xs text-muted font-normal">{movProducto?.nombre}</p>
            </div>
          </div>
        }
        visible={movOpen}
        onHide={() => setMovOpen(false)}
        style={{ width: '92vw', maxWidth: '440px' }}
        breakpoints={{ '640px': '95vw' }}
      >
        {movProducto && (
          <div>
            <div className="rounded-xl border border-border bg-bg p-3 mb-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted">Stock actual</p>
                <p className="font-bold tabular-nums">
                  {movProducto.stockActual} {movProducto.unidadMedida}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Stock resultante</p>
                <p
                  className={`font-bold tabular-nums ${
                    stockResultante < 0 || (movTipo === 'salida' && !movValido)
                      ? 'text-red-500'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {stockResultante >= 0 ? stockResultante : '—'} {movProducto.unidadMedida}
                </p>
              </div>
            </div>

            <label className="field-label">Cantidad *</label>
            <input
              className={`input ${movCantidad !== '' && !movValido ? 'input-error' : ''}`}
              type="number"
              min="1"
              max={movTipo === 'salida' ? movProducto.stockActual : undefined}
              placeholder="0"
              value={movCantidad}
              onChange={(e) => {
                setMovCantidad(e.target.value);
                setMovError('');
              }}
              autoFocus
            />
            {movTipo === 'salida' && movCantidad !== '' && cantidadNum > movProducto.stockActual && (
              <p className="field-error">
                <i className="fa-solid fa-circle-exclamation" />
                No puedes sacar más de {movProducto.stockActual} {movProducto.unidadMedida} disponibles
              </p>
            )}
            {movCantidad !== '' && cantidadNum <= 0 && (
              <p className="field-error">
                <i className="fa-solid fa-circle-exclamation" />
                La cantidad debe ser mayor a cero
              </p>
            )}

            <label className="field-label mt-3">Motivo</label>
            <select className="input" value={movMotivo} onChange={(e) => setMovMotivo(e.target.value)}>
              {(movTipo === 'entrada'
                ? ['compra', 'ajuste', 'devolución']
                : ['venta', 'consumo interno', 'vencido', 'ajuste']
              ).map((m) => (
                <option key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>

            {movError && (
              <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm px-3 py-2">
                {movError}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6 pt-4 border-t border-border">
              <Button label="Cancelar" severity="secondary" text onClick={() => setMovOpen(false)} className="w-full sm:w-auto" />
              <Button
                label={guardando ? 'Registrando…' : movTipo === 'entrada' ? 'Registrar ingreso' : 'Registrar salida'}
                icon={`fa-solid ${movTipo === 'entrada' ? 'fa-arrow-down' : 'fa-arrow-up'}`}
                severity={movTipo === 'entrada' ? 'success' : 'danger'}
                disabled={!movValido || guardando}
                loading={guardando}
                onClick={confirmarMovimiento}
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
