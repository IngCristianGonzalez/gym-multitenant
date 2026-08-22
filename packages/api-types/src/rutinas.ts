import { z } from 'zod';
import { TipoMaquinaEnum, EstadoMaquinaEnum, EstadoMiembroEnum } from './enums';
import { IdentificacionSchema, CelularSchema } from './miembros';

export const CreateMaquinaSchema = z.object({
  nombre: z.string().min(2).max(80),
  tipo: TipoMaquinaEnum,
  marca: z.string().max(60).optional(),
  modelo: z.string().max(60).optional(),
  serial: z.string().max(60).optional(),
  ubicacion: z.string().max(80).optional(),
  fechaAdquisicion: z.string().datetime().or(z.string()).optional(),
  precio: z.number().nonnegative().optional(),
  estado: EstadoMaquinaEnum.default('operativo'),
  fotoUrl: z.string().max(255).optional(),
});
export type CreateMaquinaDto = z.infer<typeof CreateMaquinaSchema>;

export const CreateEjercicioSchema = z.object({
  nombre: z.string().min(2).max(80),
  maquinaId: z.string().uuid().optional(),
  categoria: z.string().max(40).default('General'),
  descripcion: z.string().max(500).optional(),
  videoUrl: z.string().max(255).optional(),
  fotoUrl: z.string().max(255).optional(),
});
export type CreateEjercicioDto = z.infer<typeof CreateEjercicioSchema>;

export const CreateRutinaSchema = z
  .object({
    nombre: z.string().min(2).max(80),
    tipoPeriodo: z.enum(['DIA', 'SEMANA', 'MES', 'QUINCENA', 'PERSONALIZADO']),
    duracionDias: z.number().int().positive().optional(),
    diaSemana: z.number().int().min(1).max(7).optional(),
    precio: z.number().nonnegative({ message: 'El precio debe ser mayor o igual a 0' }),
    descripcion: z.string().max(500).optional(),
    ejercicios: z
      .array(
        z.object({
          ejercicioId: z.string().uuid(),
          orden: z.number().int().nonnegative().default(0),
          series: z.number().int().positive().default(3),
          repeticiones: z.string().max(20).default('12'),
          descansoMin: z.number().int().nonnegative().default(1),
        }),
      )
      .default([]),
  })
  .superRefine((data, ctx) => {
    if (data.tipoPeriodo === 'PERSONALIZADO') {
      if (!data.duracionDias || data.duracionDias < 1 || data.duracionDias > 30) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['duracionDias'],
          message: 'Para periodos personalizados indica entre 1 y 30 días',
        });
      }
    }
  });
export type CreateRutinaDto = z.infer<typeof CreateRutinaSchema>;

export const AsignarRutinaSchema = z.object({
  miembroId: z.string().uuid(),
  frecuenciaId: z.string().uuid(),
  fechaInicio: z.string().datetime().or(z.string()),
  fechaFin: z.string().datetime().or(z.string()).optional(),
  colaboradorId: z.string().uuid().optional(),
  notas: z.string().max(500).optional(),
});
export type AsignarRutinaDto = z.infer<typeof AsignarRutinaSchema>;

export const CreateColaboradorSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres').max(80),
  identificacion: IdentificacionSchema.optional(),
  celular: CelularSchema.optional(),
  cargo: z.enum(['entrenador', 'recepcionista', 'administrativo', 'nutricionista']).default('entrenador'),
  estado: EstadoMiembroEnum.default('activo'),
});
export type CreateColaboradorDto = z.infer<typeof CreateColaboradorSchema>;

export const UpdateColaboradorSchema = CreateColaboradorSchema.partial();
export type UpdateColaboradorDto = z.infer<typeof UpdateColaboradorSchema>;
