import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaDto, CreateProductoDto, MovimientoDto } from '@gym/api-types';

@Injectable()
export class InventarioService {
  constructor(private prisma: PrismaService) {}

  createCategoria(empresaId: string, dto: CreateCategoriaDto) {
    return this.prisma.categoriaProducto.create({ data: { empresaId, ...dto } });
  }

  findCategorias(empresaId: string) {
    return this.prisma.categoriaProducto.findMany({ where: { empresaId } });
  }

  createProducto(empresaId: string, dto: CreateProductoDto) {
    return this.prisma.producto.create({ data: { empresaId, ...dto } });
  }

  async findProductos(empresaId: string, bajoStock = false) {
    const productos = await this.prisma.producto.findMany({
      where: { empresaId },
      include: { categoria: true },
    });
    if (bajoStock) {
      return productos.filter((p) => p.stockActual < p.stockMinimo);
    }
    return productos;
  }

  async registrarMovimiento(empresaId: string, dto: MovimientoDto) {
    const producto = await this.prisma.producto.findFirstOrThrow({
      where: { empresaId, id: dto.productoId },
    });

    if (dto.tipo === 'salida' && producto.stockActual < dto.cantidad) {
      throw new BadRequestException('Stock insuficiente');
    }

    const balanceNuevo =
      dto.tipo === 'entrada'
        ? producto.stockActual + dto.cantidad
        : producto.stockActual - dto.cantidad;

    return this.prisma.$transaction(async (tx) => {
      await tx.inventarioMovimiento.create({
        data: {
          empresaId,
          productoId: producto.id,
          tipo: dto.tipo,
          cantidad: dto.cantidad,
          motivo: dto.motivo,
          balanceAnterior: producto.stockActual,
          balanceNuevo,
        },
      });
      return tx.producto.update({
        where: { id: producto.id },
        data: {
          stockActual:
            dto.tipo === 'entrada'
              ? { increment: dto.cantidad }
              : { decrement: dto.cantidad },
        },
      });
    });
  }

  findMovimientos(empresaId: string, page = 1, limit = 50) {
    return this.prisma.inventarioMovimiento.findMany({
      where: { empresaId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { producto: { select: { nombre: true } } },
    });
  }
}
