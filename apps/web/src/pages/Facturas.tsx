import { useEffect, useState, useMemo } from 'react';
import api from '../api/client';
import { offlineGet, offlineMutate } from '../offline/api-client';
import { abrirPdfFactura } from '../api/pdf';
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

const PAGE_SIZE = 16;

export default function Facturas() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [total, setTotal] = useState(0);
  const [anularSel, setAnularSel] = useState<Factura | null>(null);
  const [motivo, setMotivo] = useState('');
  const [anulando, setAnulando] = useState(false);
  const [page, setPage] = useState(1);

  const load = () => {
    offlineGet('/facturas', { params: { limit: 200 }, cacheKey: 'facturas' }).then((res) => {
      setFacturas(res.data.data);
      setTotal(res.data.total);
    }).catch(() => {});
  };

  useEffect(load, []);

  const anular = async () => {
    if (!anularSel) return;
    setAnulando(true);
    try {
      await offlineMutate('POST', `/facturas/${anularSel.id}/anular`, motivo ? { motivo } : {});
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

  const totalPages = Math.max(1, Math.ceil(facturas.length / PAGE_SIZE));
  const pagedList = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return facturas.slice(start, start + PAGE_SIZE);
  }, [facturas, page]);

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

      {pagedList.length === 0 ? (
        <div className="card p-8 text-center text-muted text-sm">
          Sin facturas — se crean automáticamente al registrar miembros
        </div>
      ) : (
        <>
          <div className="card-grid">
            {pagedList.map((f) => (
              <div key={f.id} className="card-item">
                <div className="card-item-header">
                  <div className="min-w-0 flex-1">
                    <p className="card-item-name">{f.numeroFactura}</p>
                    <p className="card-item-sub">
                      {f.miembro.primerNombre} {f.miembro.primerApellido}
                    </p>
                  </div>
                  <EstadoBadge estado={f.estado} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{new Date(f.fechaEmision).toLocaleDateString()}</span>
                  <span className="font-medium text-content">{f.rutina?.nombre ?? f.plan?.nombre ?? '—'}</span>
                </div>
                <div className="card-item-footer">
                  <span className="text-sm font-bold tabular-nums">{formatMoney(f.total)}</span>
                  <div className="flex gap-1">
                    <Button
                      icon="pi pi-file-pdf"
                      size="small"
                      text
                      severity="info"
                      rounded
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
                        rounded
                        tooltip="Anular"
                        tooltipOptions={{ position: 'top' }}
                        onClick={() => setAnularSel(f)}
                      />
                    )}
                  </div>
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
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-5 pt-4 border-t border-border">
              <Button label="Cancelar" severity="secondary" text onClick={() => setAnularSel(null)} className="w-full sm:w-auto" />
              <Button
                label={anulando ? 'Anulando…' : 'Anular factura'}
                icon="pi pi-ban"
                severity="danger"
                loading={anulando}
                onClick={anular}
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
