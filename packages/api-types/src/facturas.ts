import { z } from 'zod';
import { MetodoPagoEnum, EstadoFacturaEnum } from './enums';

export const CreatePlanSchema = z.object({
  nombre: z.string().min(2).max(80),
  descripcion: z.string().max(255).optional(),
  precio: z.number().positive(),
  duracionDias: z.number().int().positive().max(365),
});
export type CreatePlanDto = z.infer<typeof CreatePlanSchema>;

export const EmitirFacturaSchema = z
  .object({
    miembroId: z.string().uuid(),
    planId: z.string().uuid().optional(),
    rutinaId: z.string().uuid().optional(),
    metodoPago: MetodoPagoEnum.default('efectivo'),
    productos: z
      .array(
        z.object({
          productoId: z.string().uuid(),
          cantidad: z.number().int().positive(),
        }),
      )
      .optional()
      .default([]),
    notas: z.string().max(255).optional(),
  })
  .refine((d) => d.planId || d.rutinaId, {
    message: 'Debe indicar un plan o una rutina para emitir la factura',
    path: ['rutinaId'],
  });
export type EmitirFacturaDto = z.infer<typeof EmitirFacturaSchema>;

export const AnularFacturaSchema = z.object({
  motivo: z.string().max(255).optional(),
});
export type AnularFacturaDto = z.infer<typeof AnularFacturaSchema>;
