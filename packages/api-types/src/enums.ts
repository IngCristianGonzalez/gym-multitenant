import { z } from 'zod';

export const RolEnum = z.enum(['super_admin', 'admin', 'recepcionista']);
export type Rol = z.infer<typeof RolEnum>;

export const TipoIdEnum = z.enum(['CC', 'CE', 'TI', 'PP', 'NIT']);
export type TipoId = z.infer<typeof TipoIdEnum>;

export const TipoPeriodoEnum = z.enum([
  'DIA',
  'SEMANA',
  'MES',
  'QUINCENA',
  'PERSONALIZADO',
]);
export type TipoPeriodo = z.infer<typeof TipoPeriodoEnum>;

export const MetodoPagoEnum = z.enum([
  'efectivo',
  'tarjeta',
  'transferencia',
]);
export type MetodoPago = z.infer<typeof MetodoPagoEnum>;

export const EstadoFacturaEnum = z.enum([
  'emitida',
  'anulada',
  'cancelada',
]);
export type EstadoFactura = z.infer<typeof EstadoFacturaEnum>;

export const MovimientoEnum = z.enum(['entrada', 'salida']);
export type Movimiento = z.infer<typeof MovimientoEnum>;

export const TipoMaquinaEnum = z.enum(['fuerza', 'cardio', 'accesorio']);
export type TipoMaquina = z.infer<typeof TipoMaquinaEnum>;

export const EstadoMaquinaEnum = z.enum([
  'operativo',
  'mantenimiento',
  'fuera',
]);
export type EstadoMaquina = z.infer<typeof EstadoMaquinaEnum>;

export const EstadoMiembroEnum = z.enum([
  'activo',
  'inactivo',
  'suspendido',
]);
export type EstadoMiembro = z.infer<typeof EstadoMiembroEnum>;

export const TipoCategoriaEnum = z.enum(['producto', 'consumible']);
export type TipoCategoria = z.infer<typeof TipoCategoriaEnum>;
