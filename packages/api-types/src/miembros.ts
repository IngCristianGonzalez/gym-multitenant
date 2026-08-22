import { z } from 'zod';
import { TipoIdEnum, EstadoMiembroEnum } from './enums';

export const IdentificacionSchema = z
  .string()
  .regex(/^\d+$/, 'La identificación debe ser numérica')
  .min(5, 'Mínimo 5 dígitos')
  .max(15, 'Máximo 15 dígitos');

export const CelularSchema = z
  .string()
  .regex(/^3\d{8,10}$/, 'Debe ser numérico, comenzar por 3 y tener máximo 11 dígitos');

export const CreateMiembroSchema = z.object({
  identificacion: IdentificacionSchema,
  tipoIdentificacion: TipoIdEnum,
  primerNombre: z.string().min(3, 'Mínimo 3 caracteres').max(40),
  segundoNombre: z.string().max(40).optional(),
  primerApellido: z.string().min(5, 'Mínimo 5 caracteres').max(40),
  segundoApellido: z.string().max(40).optional(),
  fechaNacimiento: z.string().datetime().or(z.string()),
  sexo: z.enum(['M', 'F', 'O']),
  celular: CelularSchema,
  correo: z.string().email().optional(),
  direccion: z.string().max(255).optional(),
  estado: EstadoMiembroEnum.optional(),
});
export type CreateMiembroDto = z.infer<typeof CreateMiembroSchema>;

export const UpdateMiembroSchema = CreateMiembroSchema.partial();
export type UpdateMiembroDto = z.infer<typeof UpdateMiembroSchema>;

/**
 * Registro completo de un miembro en un solo paso:
 * crea el miembro, le asigna la rutina (obligatoria) y emite la factura.
 */
export const RegistroMiembroSchema = z.object({
  miembro: CreateMiembroSchema,
  frecuenciaId: z.string().uuid({ message: 'Selecciona una rutina' }),
  fechaInicio: z.string().datetime().or(z.string()),
  colaboradorId: z.string().uuid().optional(),
  metodoPago: z.enum(['efectivo', 'tarjeta', 'transferencia']).default('efectivo'),
  notas: z.string().max(255).optional(),
});
export type RegistroMiembroDto = z.infer<typeof RegistroMiembroSchema>;
