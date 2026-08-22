import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaquinaDto, CreateEjercicioDto } from '@gym/api-types';

@Injectable()
export class MaquinasService {
  constructor(private prisma: PrismaService) {}

  createMaquina(empresaId: string, dto: CreateMaquinaDto) {
    return this.prisma.maquina.create({
      data: {
        empresaId,
        nombre: dto.nombre,
        tipo: dto.tipo,
        marca: dto.marca,
        modelo: dto.modelo,
        serial: dto.serial,
        ubicacion: dto.ubicacion,
        fechaAdquisicion: dto.fechaAdquisicion
          ? new Date(dto.fechaAdquisicion)
          : undefined,
        precio: dto.precio,
        estado: dto.estado,
        fotoUrl: dto.fotoUrl,
      },
    });
  }

  findMaquinas(empresaId: string, estado?: string) {
    const where: any = { empresaId };
    if (estado) where.estado = estado;
    return this.prisma.maquina.findMany({ where });
  }

  updateEstado(empresaId: string, id: string, estado: any) {
    return this.prisma.maquina.update({
      where: { id },
      data: { estado },
    });
  }

  createEjercicio(empresaId: string, dto: CreateEjercicioDto) {
    return this.prisma.ejercicio.create({ data: { empresaId, ...dto } });
  }

  findEjercicios(empresaId: string) {
    return this.prisma.ejercicio.findMany({ where: { empresaId } });
  }
}
