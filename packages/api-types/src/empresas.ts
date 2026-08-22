import { z } from 'zod';

export const UpdateEmpresaSchema = z.object({
  nombre: z.string().min(2).max(120).optional(),
  logoUrl: z.string().max(255).optional(),
  colorPrimario: z.string().max(9).optional(),
  resolucionFactura: z.string().max(60).optional(),
  prefijoFactura: z.string().max(10).default('GYM'),
  config: z.record(z.string(), z.unknown()).optional(),
});
export type UpdateEmpresaDto = z.infer<typeof UpdateEmpresaSchema>;

export const UpsertConfigCampoSchema = z.object({
  entidad: z.enum(['miembros', 'maquinas', 'productos', 'facturas']),
  campo: z.string().min(1).max(60),
  etiqueta: z.string().max(80).optional(),
  requerido: z.boolean().default(false),
  visible: z.boolean().default(true),
  orden: z.number().int().nonnegative().default(0),
});
export type UpsertConfigCampoDto = z.infer<typeof UpsertConfigCampoSchema>;

export interface SerieMes {
  mes: string;
  total: number;
}

export interface DashboardMetrics {
  totalMiembros: number;
  miembrosActivos: number;
  facturasMes: number;
  ingresosMes: number;
  ingresosMesAnterior: number;
  nuevosMiembrosMes: number;
  productosStockBajo: number;
  maquinasMantenimiento: number;
  rutinasActivas: number;
  proximosAVencer: number;
  ingresosUltimos6Meses: SerieMes[];
  nuevosMiembrosPorMes: SerieMes[];
  miembrosPorEstado: { activo: number; inactivo: number; suspendido: number };
  maquinasPorEstado: { operativo: number; mantenimiento: number; fuera: number };
  ultimasFacturas: Array<{
    id: string;
    numeroFactura: string;
    miembro: string;
    total: number;
    estado: string;
    fechaEmision: string;
  }>;
  ultimosMovimientos: Array<{
    id: string;
    producto: string;
    tipo: string;
    cantidad: number;
    createdAt: string;
  }>;
  proximosAVencerDetalle: Array<{
    miembro: string;
    rutina: string;
    duracionDias: number;
    fechaFin: string;
    diasRestantes: number;
  }>;
}
