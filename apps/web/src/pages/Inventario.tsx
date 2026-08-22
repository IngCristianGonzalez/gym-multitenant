import { useEffect, useState } from 'react';
import api from '../api/client';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
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

export default function Inventario() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);

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
    api.get('/inventario/productos').then((res) => setProductos(res.data));
    api.get('/inventario/movimientos').then((res) => setMovimientos(res.data));
    api.get('/inventario/categorias').then((res) => setCategorias(res.data));
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
    await api.post('/inventario/productos', {
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
      await api.post('/inventario/movimientos', {
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
        <DataTable
          value={productos}
          paginator
          responsiveLayout="stack"
          breakpoint="640px"
          rows={10}
          rowsPerPageOptions={[10, 25, 50]}
          dataKey="id"
          emptyMessage="Sin productos — agrega el primero"
          className="text-sm"
        >
          <Column field="nombre" header="Producto" sortable />
          <Column
            header="Stock"
            body={(p: Producto) => (
              <div className="flex items-center gap-2">
                <span className="font-semibold tabular-nums">{p.stockActual}</span>
                <span className="text-xs text-muted">{p.unidadMedida}</span>
                {p.stockActual < p.stockMinimo && <Badge color="red">Bajo mínimo</Badge>}
              </div>
            )}
            sortable
            field="stockActual"
          />
          <Column
            header="Compra"
            body={(p: Producto) => formatMoney(p.precioCompra)}
            sortable
            field="precioCompra"
          />
          <Column
            header="Venta"
            body={(p: Producto) => formatMoney(p.precioVenta)}
            sortable
            field="precioVenta"
          />
          <Column
            header="Margen"
            body={(p: Producto) => {
              const m = p.precioVenta - p.precioCompra;
              const pct = p.precioCompra > 0 ? (m / p.precioCompra) * 100 : 0;
              return (
                <Badge color={m > 0 ? 'green' : m === 0 ? 'gray' : 'red'}>
                  {formatMoney(m)} · {pct.toFixed(0)}%
                </Badge>
              );
            }}
          />
          <Column
            header="Acciones"
            body={(p: Producto) => (
              <div className="flex gap-1.5">
                <Button
                  icon="fa-solid fa-arrow-down"
                  size="small"
                  severity="success"
                  outlined
                  tooltip={`Ingreso a bodega`}
                  tooltipOptions={{ position: 'top' }}
                  onClick={() => abrirMovimiento(p, 'entrada')}
                />
                <Button
                  icon="fa-solid fa-arrow-up"
                  size="small"
                  severity="danger"
                  outlined
                  tooltip="Salida / venta"
                  tooltipOptions={{ position: 'top' }}
                  disabled={p.stockActual <= 0}
                  onClick={() => abrirMovimiento(p, 'salida')}
                />
              </div>
            )}
          />
        </DataTable>
      </SectionCard>

      <SectionCard title="Últimos movimientos" className="mt-4">
        <DataTable
          value={movimientos.slice(0, 50)}
          paginator
          responsiveLayout="stack"
          breakpoint="640px"
          rows={10}
          dataKey="id"
          emptyMessage="Sin movimientos"
          className="text-sm"
        >
          <Column field="producto.nombre" header="Producto" />
          <Column
            header="Tipo"
            body={(m: any) => <EstadoBadge estado={m.tipo} label={m.tipo === 'entrada' ? 'Entrada' : 'Salida'} />}
          />
          <Column field="cantidad" header="Cantidad" />
          <Column field="motivo" header="Motivo" />
          <Column
            header="Fecha"
            body={(m: any) => new Date(m.createdAt).toLocaleString()}
            field="createdAt"
            sortable
          />
        </DataTable>
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
          <div className="flex justify-end gap-2 mt-5">
            <Button type="button" label="Cancelar" severity="secondary" text onClick={() => setProductoOpen(false)} />
            <Button
              type="submit"
              label="Guardar producto"
              icon="pi pi-check"
              disabled={!productoValido}
              className="!bg-brand !border-brand"
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

            <div className="flex justify-end gap-2 mt-5">
              <Button label="Cancelar" severity="secondary" text onClick={() => setMovOpen(false)} />
              <Button
                label={guardando ? 'Registrando…' : movTipo === 'entrada' ? 'Registrar ingreso' : 'Registrar salida'}
                icon={`fa-solid ${movTipo === 'entrada' ? 'fa-arrow-down' : 'fa-arrow-up'}`}
                severity={movTipo === 'entrada' ? 'success' : 'danger'}
                disabled={!movValido || guardando}
                loading={guardando}
                onClick={confirmarMovimiento}
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
