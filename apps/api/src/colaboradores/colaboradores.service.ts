import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateColaboradorDto, UpdateColaboradorDto } from '@gym/api-types';

@Injectable()
export class ColaboradoresService {
  constructor(private prisma: PrismaService) {}

  async create(empresaId: string, dto: CreateColaboradorDto) {
    if (dto.identificacion) {
      const exists = await this.prisma.colaborador.findUnique({
        where: {
          empresaId_identificacion: {
            empresaId,
            identificacion: dto.identificacion,
          },
        },
      });
      if (exists) throw new ConflictException('Ya existe un colaborador con esa identificación');
    }
    return this.prisma.colaborador.create({ data: { empresaId, ...dto } });
  }

  /**
   * Lista colaboradores con sus métricas:
   * - miembrosAsignados: miembros con asignación de rutina activa bajo él
   * - produccionTotal: suma de facturas emitidas de esos miembros
   * - produccionMes: idem pero solo del mes en curso
   */
  async findAll(empresaId: string) {
    const colaboradores = await this.prisma.colaborador.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
    });

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const conStats = await Promise.all(
      colaboradores.map(async (c) => {
        const asignaciones = await this.prisma.miembroRutina.findMany({
          where: { empresaId, colaboradorId: c.id, fechaFin: { gte: new Date() } },
          select: { miembroId: true },
        });
        const miembroIds = [...new Set(asignaciones.map((a) => a.miembroId))];

        if (miembroIds.length === 0) {
          return { ...c, miembrosAsignados: 0, produccionTotal: 0, produccionMes: 0 };
        }

        const [produccionTotal, produccionMes] = await Promise.all([
          this.prisma.factura.aggregate({
            where: { empresaId, estado: 'emitida', miembroId: { in: miembroIds } },
            _sum: { total: true },
          }),
          this.prisma.factura.aggregate({
            where: {
              empresaId,
              estado: 'emitida',
              createdAt: { gte: inicioMes },
              miembroId: { in: miembroIds },
            },
            _sum: { total: true },
          }),
        ]);

        return {
          ...c,
          miembrosAsignados: miembroIds.length,
          produccionTotal: produccionTotal._sum.total ?? 0,
          produccionMes: produccionMes._sum.total ?? 0,
        };
      }),
    );

    return conStats;
  }

  async findOne(empresaId: string, id: string) {
    const colaborador = await this.prisma.colaborador.findFirst({
      where: { empresaId, id },
      include: {
        asignaciones: {
          where: { fechaFin: { gte: new Date() } },
          include: {
            miembro: true,
            frecuencia: { select: { nombre: true, duracionDias: true } },
          },
          orderBy: { fechaFin: 'asc' },
        },
      },
    });
    if (!colaborador) throw new NotFoundException('Colaborador no encontrado');
    return colaborador;
  }

  async update(empresaId: string, id: string, dto: UpdateColaboradorDto) {
    const exists = await this.prisma.colaborador.findFirst({ where: { empresaId, id } });
    if (!exists) throw new NotFoundException('Colaborador no encontrado');
    return this.prisma.colaborador.update({ where: { id }, data: dto });
  }

  async remove(empresaId: string, id: string) {
    const exists = await this.prisma.colaborador.findFirst({ where: { empresaId, id } });
    if (!exists) throw new NotFoundException('Colaborador no encontrado');
    return this.prisma.colaborador.delete({ where: { id } });
  }
}
