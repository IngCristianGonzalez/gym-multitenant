import { ReactNode } from 'react';

export const formatMoney = (n: number) =>
  `$${Math.round(n).toLocaleString('es-CO')}`;

const badgeColors: Record<string, string> = {
  green: 'badge-green',
  red: 'badge-red',
  blue: 'badge-blue',
  amber: 'badge-amber',
  purple: 'badge-purple',
  gray: 'badge-gray',
};

export function Badge({
  color = 'gray',
  children,
}: {
  color?: keyof typeof badgeColors;
  children: ReactNode;
}) {
  return <span className={`badge ${badgeColors[color]}`}>{children}</span>;
}

export const estadoBadgeColor: Record<string, keyof typeof badgeColors> = {
  activo: 'green',
  operativo: 'green',
  emitida: 'blue',
  entrada: 'green',
  inactivo: 'gray',
  suspendido: 'red',
  mantenimiento: 'amber',
  anulada: 'red',
  cancelada: 'gray',
  fuera: 'red',
  salida: 'red',
};

export function EstadoBadge({ estado, label }: { estado: string; label?: string }) {
  return (
    <Badge color={estadoBadgeColor[estado] ?? 'gray'}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label ?? estado.charAt(0).toUpperCase() + estado.slice(1)}
    </Badge>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  tone?: 'brand' | 'blue' | 'amber' | 'red' | 'purple';
  hint?: string;
}

const tones: Record<NonNullable<StatCardProps['tone']>, string> = {
  brand: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  red: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400',
};

export function StatCard({ label, value, icon, tone = 'brand', hint }: StatCardProps) {
  return (
    <div className="card card-hover p-4 flex items-center gap-3 animate-fade-up">
      <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${tones[tone]}`}>
        <i className={`fa-solid ${icon} text-lg`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted truncate">{label}</p>
        <p className="text-xl font-bold tabular-nums leading-tight">{value}</p>
        {hint && <p className="text-[11px] text-muted truncate">{hint}</p>}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-5">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-0.5 truncate">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function SectionCard({
  title,
  right,
  children,
  className = '',
}: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card p-4 sm:p-5 animate-fade-up ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between mb-3">
          {title && <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}
