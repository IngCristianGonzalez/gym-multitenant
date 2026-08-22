import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertConfigCampoDto } from '@gym/api-types';

@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaService) {}

  async upsertCampo(empresaId: string, dto: UpsertConfigCampoDto) {
    return this.prisma.configCampo.upsert({
      where: {
        empresaId_entidad_campo: {
          empresaId,
          entidad: dto.entidad,
          campo: dto.campo,
        },
      },
      create: {
        empresaId,
        entidad: dto.entidad,
        campo: dto.campo,
        etiqueta: dto.etiqueta,
        requerido: dto.requerido,
        visible: dto.visible,
        orden: dto.orden,
      },
      update: {
        etiqueta: dto.etiqueta,
        requerido: dto.requerido,
        visible: dto.visible,
        orden: dto.orden,
      },
    });
  }

  async getCampos(empresaId: string, entidad?: string) {
    const where: any = { empresaId };
    if (entidad) where.entidad = entidad;
    return this.prisma.configCampo.findMany({
      where,
      orderBy: { orden: 'asc' },
    });
  }

  async dashboard(empresaId: string) {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const ahora = new Date();
    const en3Dias = new Date();
    en3Dias.setDate(ahora.getDate() + 3);

    // Ventanas de tiempo para series de 6 meses
    const inicio6Meses = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);
    const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59);

    const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const [
      totalMiembros,
      miembrosActivos,
      facturasMes,
      ingresosMes,
      ingresosMesAnterior,
      nuevosMiembrosMes,
      maquinasMantenimiento,
      rutinasActivas,
      productos,
      porVencer,
      miembrosPorEstadoRaw,
      maquinasPorEstadoRaw,
      facturas6Meses,
      miembros6Meses,
      ultimasFacturas,
      ultimosMovimientos,
    ] = await Promise.all([
      this.prisma.miembro.count({ where: { empresaId } }),
      this.prisma.miembro.count({ where: { empresaId, estado: 'activo' } }),
      this.prisma.factura.count({
        where: { empresaId, createdAt: { gte: inicioMes }, estado: 'emitida' },
      }),
      this.prisma.factura.aggregate({
        where: { empresaId, createdAt: { gte: inicioMes }, estado: 'emitida' },
        _sum: { total: true },
      }),
      this.prisma.factura.aggregate({
        where: {
          empresaId,
          estado: 'emitida',
          createdAt: { gte: inicioMesAnterior, lte: finMesAnterior },
        },
        _sum: { total: true },
      }),
      this.prisma.miembro.count({
        where: { empresaId, fechaRegistro: { gte: inicioMes } },
      }),
      this.prisma.maquina.count({
        where: { empresaId, estado: 'mantenimiento' },
      }),
      this.prisma.miembroRutina.count({
        where: { empresaId, fechaFin: { gte: new Date() } },
      }),
      this.prisma.producto.findMany({
        where: { empresaId },
        select: { stockActual: true, stockMinimo: true },
      }),
      this.prisma.miembroRutina.findMany({
        where: { empresaId, fechaFin: { gte: ahora, lte: en3Dias } },
        include: {
          miembro: true,
          frecuencia: { select: { nombre: true, duracionDias: true } },
        },
        orderBy: { fechaFin: 'asc' },
      }),
      this.prisma.miembro.groupBy({
        by: ['estado'],
        where: { empresaId },
        _count: true,
      }),
      this.prisma.maquina.groupBy({
        by: ['estado'],
        where: { empresaId },
        _count: true,
      }),
      // Facturas de los últimos 6 meses para la serie de ingresos
      this.prisma.factura.findMany({
        where: {
          empresaId,
          estado: 'emitida',
          createdAt: { gte: inicio6Meses },
        },
        select: { total: true, createdAt: true },
      }),
      this.prisma.miembro.findMany({
        where: { empresaId, fechaRegistro: { gte: inicio6Meses } },
        select: { fechaRegistro: true },
      }),
      this.prisma.factura.findMany({
        where: { empresaId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { miembro: { select: { primerNombre: true, primerApellido: true } } },
      }),
      this.prisma.inventarioMovimiento.findMany({
        where: { empresaId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { producto: { select: { nombre: true } } },
      }),
    ]);

    const productosStockBajo = productos.filter(
      (p) => p.stockActual < p.stockMinimo,
    ).length;

    const proximosAVencerDetalle = porVencer.map((a) => {
      const diasRestantes = Math.ceil(
        (a.fechaFin!.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        miembro: `${a.miembro.primerNombre} ${a.miembro.primerApellido}`,
        rutina: a.frecuencia.nombre,
        duracionDias: a.frecuencia.duracionDias,
        fechaFin: a.fechaFin!.toISOString(),
        diasRestantes,
      };
    });

    // Series mensuales (últimos 6 meses, siempre completas)
    const ingresosUltimos6Meses = [] as Array<{ mes: string; total: number }>;
    const nuevosMiembrosPorMes = [] as Array<{ mes: string; total: number }>;
    for (let i = 5; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const etiqueta = MESES[d.getMonth()];
      ingresosUltimos6Meses.push({ mes: etiqueta, total: 0 });
      nuevosMiembrosPorMes.push({ mes: etiqueta, total: 0 });
    }
    for (const f of facturas6Meses) {
      const diff =
        (f.createdAt.getFullYear() - inicio6Meses.getFullYear()) * 12 +
        (f.createdAt.getMonth() - inicio6Meses.getMonth());
      if (diff >= 0 && diff < 6) ingresosUltimos6Meses[diff].total += f.total;
    }
    for (const m of miembros6Meses) {
      const diff =
        (m.fechaRegistro.getFullYear() - inicio6Meses.getFullYear()) * 12 +
        (m.fechaRegistro.getMonth() - inicio6Meses.getMonth());
      if (diff >= 0 && diff < 6) nuevosMiembrosPorMes[diff].total += 1;
    }

    const miembrosPorEstado = { activo: 0, inactivo: 0, suspendido: 0 };
    for (const row of miembrosPorEstadoRaw) {
      miembrosPorEstado[row.estado] = row._count;
    }
    const maquinasPorEstado = { operativo: 0, mantenimiento: 0, fuera: 0 };
    for (const row of maquinasPorEstadoRaw) {
      maquinasPorEstado[row.estado] = row._count;
    }

    return {
      totalMiembros,
      miembrosActivos,
      facturasMes,
      ingresosMes: ingresosMes._sum.total ?? 0,
      ingresosMesAnterior: ingresosMesAnterior._sum.total ?? 0,
      nuevosMiembrosMes,
      productosStockBajo,
      maquinasMantenimiento,
      rutinasActivas,
      proximosAVencer: proximosAVencerDetalle.length,
      ingresosUltimos6Meses,
      nuevosMiembrosPorMes,
      miembrosPorEstado,
      maquinasPorEstado,
      ultimasFacturas: ultimasFacturas.map((f) => ({
        id: f.id,
        numeroFactura: f.numeroFactura,
        miembro: `${f.miembro.primerNombre} ${f.miembro.primerApellido}`,
        total: f.total,
        estado: f.estado,
        fechaEmision: f.createdAt.toISOString(),
      })),
      ultimosMovimientos: ultimosMovimientos.map((m) => ({
        id: m.id,
        producto: m.producto.nombre,
        tipo: m.tipo,
        cantidad: m.cantidad,
        createdAt: m.createdAt.toISOString(),
      })),
      proximosAVencerDetalle,
    };
  }
}
