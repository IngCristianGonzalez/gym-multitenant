import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmitirFacturaDto } from '@gym/api-types';

@Injectable()
export class FacturasService {
  constructor(private prisma: PrismaService) {}

  async emitir(empresaId: string, dto: EmitirFacturaDto) {
    return this.prisma.$transaction(async (tx) => {
      const miembro = await tx.miembro.findFirstOrThrow({
        where: { empresaId, id: dto.miembroId },
      });

      // El item facturable puede ser un plan (legacy) o una rutina
      let conceptoSuscripcion: string;
      let precio: number;
      let duracionDias: number;
      if (dto.rutinaId) {
        const rutina = await tx.frecuenciaRutina.findFirstOrThrow({
          where: { empresaId, id: dto.rutinaId },
        });
        conceptoSuscripcion = `Suscripción: ${rutina.nombre}`;
        precio = rutina.precio;
        duracionDias = rutina.duracionDias ?? 30;
      } else if (dto.planId) {
        const plan = await tx.plan.findFirstOrThrow({
          where: { empresaId, id: dto.planId },
        });
        conceptoSuscripcion = `Suscripción: ${plan.nombre}`;
        precio = plan.precio;
        duracionDias = plan.duracionDias;
      } else {
        throw new Error('Debe indicar una rutina o un plan');
      }

      // Numeración secuencial por empresa (incremento atómico)
      const updatedEmpresa = await tx.empresa.update({
        where: { id: empresaId },
        data: { facturaSecuencia: { increment: 1 } },
        select: { prefijoFactura: true, facturaSecuencia: true },
      });
      const secuencia = updatedEmpresa.facturaSecuencia;
      const numero = `${updatedEmpresa.prefijoFactura}-${secuencia
        .toString()
        .padStart(6, '0')}`;

      // Detalles: suscripción + productos opcionales
      const detalles: any[] = [];
      let subtotal = 0;

      detalles.push({
        concepto: conceptoSuscripcion,
        cantidad: 1,
        precioUnitario: precio,
        subtotal: precio,
      });
      subtotal += precio;

      if (dto.productos && dto.productos.length > 0) {
        for (const p of dto.productos) {
          const producto = await tx.producto.findFirstOrThrow({
            where: { empresaId, id: p.productoId },
          });
          if (producto.stockActual < p.cantidad) {
            throw new Error(
              `Stock insuficiente para ${producto.nombre}`,
            );
          }
          const sub = producto.precioVenta * p.cantidad;
          detalles.push({
            productoId: producto.id,
            concepto: producto.nombre,
            cantidad: p.cantidad,
            precioUnitario: producto.precioVenta,
            subtotal: sub,
          });
          subtotal += sub;

          // Movimiento de salida (venta)
          await tx.inventarioMovimiento.create({
            data: {
              empresaId,
              productoId: producto.id,
              tipo: 'salida',
              cantidad: p.cantidad,
              motivo: 'venta',
              balanceAnterior: producto.stockActual,
              balanceNuevo: producto.stockActual - p.cantidad,
            },
          });
          await tx.producto.update({
            where: { id: producto.id },
            data: { stockActual: { decrement: p.cantidad } },
          });
        }
      }

      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + duracionDias);

      const factura = await tx.factura.create({
        data: {
          empresaId,
          miembroId: miembro.id,
          planId: dto.planId ?? null,
          rutinaId: dto.rutinaId ?? null,
          numeroFactura: numero,
          fechaVencimiento,
          subtotal,
          total: subtotal, // precio final ya incluye IVA
          metodoPago: dto.metodoPago,
          notas: dto.notas,
          detalles: {
            create: detalles,
          },
        },
        include: {
          detalles: true,
          miembro: true,
          empresa: true,
        },
      });

      return factura;
    });
  }

  async findAll(empresaId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.factura.findMany({
        where: { empresaId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          miembro: true,
          rutina: { select: { nombre: true } },
          plan: { select: { nombre: true } },
        },
      }),
      this.prisma.factura.count({ where: { empresaId } }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(empresaId: string, id: string) {
    const factura = await this.prisma.factura.findFirst({
      where: { empresaId, id },
      include: {
        detalles: true,
        miembro: true,
        empresa: true,
        rutina: { select: { nombre: true } },
        plan: { select: { nombre: true } },
      },
    });
    if (!factura) throw new NotFoundException('Factura no encontrada');
    return factura;
  }

  async anular(empresaId: string, id: string, motivo?: string) {
    // Si la factura tenía productos, revertir stock
    const factura = await this.prisma.factura.findFirstOrThrow({
      where: { empresaId, id },
      include: { detalles: true },
    });
    if (factura.estado !== 'emitida') {
      throw new Error('Solo se pueden anular facturas emitidas');
    }
    await this.prisma.$transaction(async (tx) => {
      for (const d of factura.detalles) {
        if (d.productoId) {
          const producto = await tx.producto.findUnique({
            where: { id: d.productoId },
          });
          if (producto) {
            await tx.inventarioMovimiento.create({
              data: {
                empresaId,
                productoId: producto.id,
                tipo: 'entrada',
                cantidad: d.cantidad,
                motivo: 'anulacion',
                balanceAnterior: producto.stockActual,
                balanceNuevo: producto.stockActual + d.cantidad,
              },
            });
            await tx.producto.update({
              where: { id: producto.id },
              data: { stockActual: { increment: d.cantidad } },
            });
          }
        }
      }
      await tx.factura.update({
        where: { id },
        data: { estado: 'anulada', notas: motivo ?? factura.notas },
      });
    });
    return { ok: true };
  }
}
