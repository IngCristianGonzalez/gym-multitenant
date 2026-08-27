import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRutinaDto, AsignarRutinaDto } from '@gym/api-types';

@Injectable()
export class RutinasService {
  constructor(private prisma: PrismaService) {}

  createRutina(empresaId: string, dto: CreateRutinaDto) {
    return this.prisma.frecuenciaRutina.create({
      data: {
        empresaId,
        nombre: dto.nombre,
        tipoPeriodo: dto.tipoPeriodo,
        duracionDias: dto.duracionDias,
        diaSemana: dto.diaSemana,
        precio: dto.precio,
        descripcion: dto.descripcion,
        ejercicios: {
          create: dto.ejercicios.map((e) => ({
            ejercicioId: e.ejercicioId,
            orden: e.orden,
            series: e.series,
            repeticiones: e.repeticiones,
            descansoMin: e.descansoMin,
          })),
        },
      },
      include: { ejercicios: { include: { ejercicio: true } } },
    });
  }

  findAll(empresaId: string) {
    return this.prisma.frecuenciaRutina.findMany({
      where: { empresaId },
      include: { ejercicios: { include: { ejercicio: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async asignar(empresaId: string, dto: AsignarRutinaDto) {
    const rutina = await this.prisma.frecuenciaRutina.findFirst({
      where: { empresaId, id: dto.frecuenciaId },
    });
    if (!rutina) throw new NotFoundException('La rutina no existe');

    // Auto-finalizar rutina activa anterior si existe
    const activa = await this.prisma.miembroRutina.findFirst({
      where: {
        empresaId,
        miembroId: dto.miembroId,
        fechaFin: { gte: new Date() },
      },
    });
    if (activa) {
      await this.prisma.miembroRutina.update({
        where: { id: activa.id },
        data: { fechaFin: new Date() },
      });
    }

    if (dto.colaboradorId) {
      const colaborador = await this.prisma.colaborador.findFirst({
        where: { empresaId, id: dto.colaboradorId },
      });
      if (!colaborador) throw new NotFoundException('El colaborador no existe');
    }

    const fechaInicio = new Date(dto.fechaInicio);
    const fechaFin = dto.fechaFin
      ? new Date(dto.fechaFin)
      : (() => {
          const f = new Date(fechaInicio);
          f.setDate(f.getDate() + (rutina.duracionDias ?? 30));
          return f;
        })();

    return this.prisma.miembroRutina.create({
      data: {
        empresaId,
        miembroId: dto.miembroId,
        frecuenciaId: dto.frecuenciaId,
        fechaInicio,
        fechaFin,
        colaboradorId: dto.colaboradorId,
        notas: dto.notas,
      },
      include: {
        miembro: true,
        frecuencia: true,
        colaborador: { select: { id: true, nombre: true, cargo: true } },
      },
    });
  }

  findAsignaciones(empresaId: string, miembroId?: string) {
    const where: any = { empresaId };
    if (miembroId) where.miembroId = miembroId;
    return this.prisma.miembroRutina.findMany({
      where,
      include: {
        miembro: true,
        frecuencia: true,
        colaborador: { select: { id: true, nombre: true, cargo: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
