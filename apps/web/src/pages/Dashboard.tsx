import { useEffect, useState } from 'react';
import api from '../api/client';
import { DashboardMetrics } from '@gym/api-types';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { baseOptions, doughnutOptions, brandColor, pastelPalette } from '../components/charts';
import {
  StatCard,
  Badge,
  EstadoBadge,
  SectionCard,
  PageHeader,
  formatMoney,
} from '../components/ui';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    api.get('/config/dashboard').then((res) => setMetrics(res.data));
  }, []);

  if (!metrics)
    return (
      <div className="flex items-center justify-center h-64 text-muted">
        <i className="fa-solid fa-circle-notch fa-spin mr-2" /> Cargando métricas…
      </div>
    );

  const detalle = metrics.proximosAVencerDetalle;
  const vencen = detalle.length;
  const caducanHoy = detalle.filter((d) => d.diasRestantes <= 0).length;

  const tendencia =
    metrics.ingresosMesAnterior > 0
      ? Math.round(
          ((metrics.ingresosMes - metrics.ingresosMesAnterior) / metrics.ingresosMesAnterior) * 100,
        )
      : null;

  const story = `De ${metrics.totalMiembros} miembros, ${metrics.miembrosActivos} están activos y este mes vas ${metrics.facturasMes} facturas por ${formatMoney(metrics.ingresosMes)}. ${
    vencen > 0
      ? `Hay ${vencen} membresía(s) por vencer en los próximos 3 días${
          caducanHoy > 0 ? ` (${caducanHoy} caduca(n) hoy)` : ''
        }: contactar antes de que caduquen para renovar.`
      : 'No hay membresías por vencer en los próximos 3 días.'
  }${
    metrics.productosStockBajo > 0
      ? ` Además, ${metrics.productosStockBajo} producto(s) de la nevera están bajo mínimo.`
      : ''
  }`;

  const ingresosChart = {
    labels: metrics.ingresosUltimos6Meses.map((d) => d.mes),
    datasets: [
      {
        label: 'Ingresos',
        data: metrics.ingresosUltimos6Meses.map((d) => d.total),
        borderColor: brandColor(),
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return `${brandColor()}33`;
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, `${brandColor()}55`);
          g.addColorStop(1, `${brandColor()}05`);
          return g;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 3,
        pointBackgroundColor: brandColor(),
      },
    ],
  };

  const miembrosChart = {
    labels: metrics.nuevosMiembrosPorMes.map((d) => d.mes),
    datasets: [
      {
        label: 'Nuevos miembros',
        data: metrics.nuevosMiembrosPorMes.map((d) => d.total),
        backgroundColor: pastelPalette.blue,
        borderRadius: 6,
        maxBarThickness: 28,
      },
    ],
  };

  const estadosMiembrosChart = {
    labels: ['Activos', 'Inactivos', 'Suspendidos'],
    datasets: [
      {
        data: [
          metrics.miembrosPorEstado.activo,
          metrics.miembrosPorEstado.inactivo,
          metrics.miembrosPorEstado.suspendido,
        ],
        backgroundColor: [pastelPalette.green, pastelPalette.gray, pastelPalette.red],
        borderWidth: 0,
      },
    ],
  };

  const maquinasChart = {
    labels: ['Operativas', 'Mantenimiento', 'Fuera'],
    datasets: [
      {
        data: [
          metrics.maquinasPorEstado.operativo,
          metrics.maquinasPorEstado.mantenimiento,
          metrics.maquinasPorEstado.fuera,
        ],
        backgroundColor: [pastelPalette.green, pastelPalette.amber, pastelPalette.red],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div>
      <PageHeader
        title="Resumen"
        subtitle="Panorama general de tu gimnasio este mes"
      />

      {/* KPIs principales */}
      <div className="grid grid-cols-1 xs:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          label="Miembros totales"
          value={metrics.totalMiembros}
          icon="fa-users"
          tone="brand"
          hint={`${metrics.nuevosMiembrosMes} nuevos este mes`}
        />
        <StatCard
          label="Miembros activos"
          value={metrics.miembrosActivos}
          icon="fa-user-check"
          tone="blue"
          hint={`Rutinas activas: ${metrics.rutinasActivas}`}
        />
        <StatCard
          label="Ingresos del mes"
          value={formatMoney(metrics.ingresosMes)}
          icon="fa-coins"
          tone="purple"
          hint={
            tendencia !== null
              ? `${tendencia >= 0 ? '▲' : '▼'} ${Math.abs(tendencia)}% vs mes anterior`
              : undefined
          }
        />
        <StatCard
          label="Facturas del mes"
          value={metrics.facturasMes}
          icon="fa-file-invoice-dollar"
          tone="amber"
        />
      </div>

      {/* Alertas secundarias */}
      <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 mt-3">
        <StatCard
          label="Próximos a vencer (3 días)"
          value={metrics.proximosAVencer}
          icon="fa-hourglass-end"
          tone={metrics.proximosAVencer > 0 ? 'red' : 'brand'}
        />
        <StatCard
          label="Productos bajo mínimo"
          value={metrics.productosStockBajo}
          icon="fa-box-open"
          tone={metrics.productosStockBajo > 0 ? 'amber' : 'brand'}
        />
        <StatCard
          label="Máquinas en mantenimiento"
          value={metrics.maquinasMantenimiento}
          icon="fa-screwdriver-wrench"
          tone={metrics.maquinasMantenimiento > 0 ? 'amber' : 'brand'}
        />
      </div>

      {/* Historia */}
      <div className="mt-4 rounded-xl p-4 border-l-4 border-l-brand bg-brand/5 border border-border flex gap-3">
        <i className="fa-solid fa-lightbulb text-brand mt-0.5" />
        <p className="text-sm leading-relaxed">{story}</p>
      </div>

      {/* Gráficas principales */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">
        <SectionCard title="Ingresos · últimos 6 meses" className="lg:col-span-3">
          <div className="h-60">
            <Line data={ingresosChart} options={baseOptions() as any} />
          </div>
        </SectionCard>
        <SectionCard title="Nuevos miembros por mes" className="lg:col-span-2">
          <div className="h-60">
            <Bar data={miembrosChart} options={baseOptions() as any} />
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
        <SectionCard title="Estados de miembros" className="lg:col-span-2">
          <div className="h-56">
            <Doughnut data={estadosMiembrosChart} options={doughnutOptions() as any} />
          </div>
        </SectionCard>
        <SectionCard title="Estado de máquinas" className="lg:col-span-2">
          <div className="h-56">
            <Doughnut data={maquinasChart} options={doughnutOptions() as any} />
          </div>
        </SectionCard>

        {/* Actividad reciente */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          <SectionCard title="Últimas facturas">
            <ul className="space-y-2.5">
              {metrics.ultimasFacturas.length === 0 && (
                <li className="text-sm text-muted">Sin facturas aún</li>
              )}
              {metrics.ultimasFacturas.slice(0, 4).map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{f.miembro}</p>
                    <p className="text-xs text-muted">{f.numeroFactura}</p>
                  </div>
                  <span className="font-semibold tabular-nums whitespace-nowrap">
                    {formatMoney(f.total)}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="Movimientos recientes">
            <ul className="space-y-2.5">
              {metrics.ultimosMovimientos.length === 0 && (
                <li className="text-sm text-muted">Sin movimientos aún</li>
              )}
              {metrics.ultimosMovimientos.slice(0, 4).map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.producto}</p>
                    <Badge color={m.tipo === 'entrada' ? 'green' : 'red'}>
                      {m.tipo === 'entrada' ? '+' : '−'}
                      {m.cantidad}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>

      {/* Próximos a vencer */}
      <SectionCard title="Próximos a vencer" className="mt-4">
        {detalle.length === 0 ? (
          <p className="text-sm text-muted py-4 text-center">
            No hay membresías por vencer en los próximos 3 días 🎉
          </p>
        ) : (
          <ul className="divide-y divide-border -mx-1">
            {detalle.map((d, i) => (
              <li key={i} className="py-3 px-1 flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{d.miembro}</p>
                  <p className="text-xs text-muted">{d.rutina}</p>
                </div>
                <div className="w-full sm:w-40">
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        d.diasRestantes <= 0
                          ? 'bg-red-400'
                          : d.diasRestantes <= 1
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{
                        width: `${Math.max(
                          8,
                          Math.min(100, (d.diasRestantes / Math.max(d.duracionDias, 1)) * 100),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="sm:w-32 sm:text-right">
                  <Badge color={d.diasRestantes <= 0 ? 'red' : d.diasRestantes <= 1 ? 'amber' : 'green'}>
                    {d.diasRestantes <= 0 ? 'Vence hoy' : `Vence en ${d.diasRestantes} días`}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
