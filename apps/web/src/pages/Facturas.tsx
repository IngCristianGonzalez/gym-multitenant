import { useEffect, useState } from 'react';
import api from '../api/client';
import { abrirPdfFactura } from '../api/pdf';
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

interface Factura {
  id: string;
  numeroFactura: string;
  fechaEmision: string;
  total: number;
  estado: string;
  miembro: { primerNombre: string; primerApellido: string };
  rutina?: { nombre: string } | null;
  plan?: { nombre: string } | null;
}

export default function Facturas() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [total, setTotal] = useState(0);
  const [anularSel, setAnularSel] = useState<Factura | null>(null);
  const [motivo, setMotivo] = useState('');
  const [anulando, setAnulando] = useState(false);

  const load = () => {
    api.get('/facturas', { params: { limit: 50 } }).then((res) => {
      setFacturas(res.data.data);
      setTotal(res.data.total);
    });
  };

  useEffect(load, []);

  const anular = async () => {
    if (!anularSel) return;
    setAnulando(true);
    try {
      await api.post(`/facturas/${anularSel.id}/anular`, motivo ? { motivo } : {});
      setAnularSel(null);
      setMotivo('');
      load();
    } finally {
      setAnulando(false);
    }
  };

  const totalMes = facturas
    .filter(
      (f) =>
        f.estado === 'emitida' &&
        new Date(f.fechaEmision).getMonth() === new Date().getMonth(),
    )
    .reduce((acc, f) => acc + f.total, 0);

  return (
    <div>
      <PageHeader
        title="Facturas"
        subtitle="Se emiten automáticamente al registrar un miembro con su rutina"
      />

      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 mb-4">
        <StatCard label="Facturas emitidas (histórico)" value={total} icon="fa-file-invoice-dollar" tone="blue" />
        <StatCard label="Recaudo este mes" value={formatMoney(totalMes)} icon="fa-coins" tone="purple" />
      </div>

      <SectionCard>
        <DataTable
          value={facturas}
          paginator
          responsiveLayout="stack"
          breakpoint="640px"
          rows={10}
          rowsPerPageOptions={[10, 25, 50]}
          dataKey="id"
          emptyMessage="Sin facturas — se crean automáticamente al registrar miembros"
          className="text-sm"
        >
          <Column field="numeroFactura" header="Número" sortable />
          <Column
            header="Miembro"
            body={(f: Factura) => `${f.miembro.primerNombre} ${f.miembro.primerApellido}`}
          />
          <Column
            header="Concepto"
            body={(f: Factura) => (
              <span className="text-xs">{f.rutina?.nombre ?? f.plan?.nombre ?? '—'}</span>
            )}
          />
          <Column
            header="Fecha"
            body={(f: Factura) => new Date(f.fechaEmision).toLocaleDateString()}
            sortable
            field="fechaEmision"
          />
          <Column field="total" header="Total" body={(f: Factura) => formatMoney(f.total)} />
          <Column
            header="Estado"
            body={(f: Factura) => <EstadoBadge estado={f.estado} />}
          />
          <Column
            header="Acciones"
            body={(f: Factura) => (
              <div className="flex gap-1.5">
                <Button
                  icon="pi pi-file-pdf"
                  size="small"
                  text
                  severity="info"
                  tooltip="Ver PDF"
                  tooltipOptions={{ position: 'top' }}
                  onClick={() => abrirPdfFactura(f.id)}
                />
                {f.estado === 'emitida' && (
                  <Button
                    icon="pi pi-ban"
                    size="small"
                    text
                    severity="danger"
                    tooltip="Anular"
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => setAnularSel(f)}
                  />
                )}
              </div>
            )}
          />
        </DataTable>
      </SectionCard>

      {/* Modal anular */}
      <Dialog
        header="Anular factura"
        visible={!!anularSel}
        onHide={() => setAnularSel(null)}
        style={{ width: '92vw', maxWidth: '440px' }}
      >
        {anularSel && (
          <div>
            <p className="text-sm text-muted mb-3">
              Se anulará la factura <strong>{anularSel.numeroFactura}</strong> de{' '}
              <strong>
                {anularSel.miembro.primerNombre} {anularSel.miembro.primerApellido}
              </strong>{' '}
              por {formatMoney(anularSel.total)}. Esta acción no se puede deshacer.
            </p>
            <label className="field-label">Motivo (opcional)</label>
            <input
              className="input"
              placeholder="Ej. error de digitación"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button label="Cancelar" severity="secondary" text onClick={() => setAnularSel(null)} />
              <Button
                label={anulando ? 'Anulando…' : 'Anular'}
                icon="pi pi-ban"
                severity="danger"
                loading={anulando}
                onClick={anular}
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
