import { z } from 'zod';
import { TipoCategoriaEnum, MovimientoEnum } from './enums';

export const CreateCategoriaSchema = z.object({
  nombre: z.string().min(2).max(60),
  tipo: TipoCategoriaEnum.default('producto'),
});
export type CreateCategoriaDto = z.infer<typeof CreateCategoriaSchema>;

export const CreateProductoSchema = z.object({
  categoriaId: z.string().uuid(),
  nombre: z.string().min(2).max(80),
  descripcion: z.string().max(255).optional(),
  precioVenta: z.number().nonnegative(),
  precioCompra: z.number().nonnegative().optional(),
  stockActual: z.number().int().nonnegative().default(0),
  stockMinimo: z.number().int().nonnegative().default(0),
  unidadMedida: z.string().max(20).default('unidad'),
  fotoUrl: z.string().max(255).optional(),
});
export type CreateProductoDto = z.infer<typeof CreateProductoSchema>;

export const MovimientoSchema = z.object({
  productoId: z.string().uuid(),
  tipo: MovimientoEnum,
  cantidad: z.number().int().positive(),
  motivo: z.string().max(60).default('ajuste'),
});
export type MovimientoDto = z.infer<typeof MovimientoSchema>;
