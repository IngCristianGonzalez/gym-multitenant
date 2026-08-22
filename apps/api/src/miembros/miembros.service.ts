import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMiembroDto,
  UpdateMiembroDto,
  RegistroMiembroDto,
} from '@gym/api-types';

@Injectable()
export class MiembrosService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registro completo en una transacción:
   * 1. Crea el miembro
   * 2. Le asigna la rutina (validando que no tenga otra activa)
   * 3. Emite la factura con el precio de la rutina
   */
  async registroCompleto(empresaId: string, dto: RegistroMiembroDto) {
    const { miembro: miembroDto, frecuenciaId } = dto;

    const exists = await this.prisma.miembro.findUnique({
      where: { empresaId_identificacion: { empresaId, identificacion: miembroDto.identificacion } },
    });
    if (exists) {
      throw new ConflictException('La identificación ya está registrada en esta empresa');
    }

    return this.prisma.$transaction(async (tx) => {
      const miembro = await tx.miembro.create({
        data: {
          empresaId,
          identificacion: miembroDto.identificacion,
          tipoIdentificacion: miembroDto.tipoIdentificacion,
          primerNombre: miembroDto.primerNombre,
          segundoNombre: miembroDto.segundoNombre,
          primerApellido: miembroDto.primerApellido,
          segundoApellido: miembroDto.segundoApellido,
          fechaNacimiento: new Date(miembroDto.fechaNacimiento),
          sexo: miembroDto.sexo,
          celular: miembroDto.celular,
          correo: miembroDto.correo,
          direccion: miembroDto.direccion,
          estado: miembroDto.estado ?? 'activo',
        },
      });

      // Rutina obligatoria: debe existir y tener precio > 0 definido
      const rutina = await tx.frecuenciaRutina.findFirst({
        where: { empresaId, id: frecuenciaId },
      });
      if (!rutina) {
        throw new NotFoundException('La rutina seleccionada no existe');
      }

      const fechaInicio = new Date(dto.fechaInicio);
      if (Number.isNaN(fechaInicio.getTime())) {
        throw new BadRequestException('Fecha de inicio inválida');
      }
      const duracion = rutina.duracionDias ?? 30;
      const fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaFin.getDate() + duracion);

      if (dto.colaboradorId) {
        const colaborador = await tx.colaborador.findFirst({
          where: { empresaId, id: dto.colaboradorId },
        });
        if (!colaborador) throw new NotFoundException('El colaborador seleccionado no existe');
      }

      const asignacion = await tx.miembroRutina.create({
        data: {
          empresaId,
          miembroId: miembro.id,
          frecuenciaId: rutina.id,
          fechaInicio,
          fechaFin,
          colaboradorId: dto.colaboradorId,
          notas: dto.notas,
        },
      });

      // Emisión de factura inmediata con el precio de la rutina
      const updatedEmpresa = await tx.empresa.update({
        where: { id: empresaId },
        data: { facturaSecuencia: { increment: 1 } },
        select: { prefijoFactura: true, facturaSecuencia: true },
      });
      const numero = `${updatedEmpresa.prefijoFactura}-${updatedEmpresa.facturaSecuencia
        .toString()
        .padStart(6, '0')}`;

      const factura = await tx.factura.create({
        data: {
          empresaId,
          miembroId: miembro.id,
          rutinaId: rutina.id,
          numeroFactura: numero,
          fechaVencimiento: fechaFin,
          subtotal: rutina.precio,
          total: rutina.precio,
          metodoPago: dto.metodoPago,
          notas: dto.notas,
          detalles: {
            create: [
              {
                concepto: `Suscripción: ${rutina.nombre}`,
                cantidad: 1,
                precioUnitario: rutina.precio,
                subtotal: rutina.precio,
              },
            ],
          },
        },
      });

      return { miembro, asignacion, factura };
    });
  }

  async create(empresaId: string, dto: CreateMiembroDto) {
    const exists = await this.prisma.miembro.findUnique({
      where: { empresaId_identificacion: { empresaId, identificacion: dto.identificacion } },
    });
    if (exists) {
      throw new ConflictException('La identificación ya está registrada en esta empresa');
    }
    return this.prisma.miembro.create({
      data: {
        empresaId,
        identificacion: dto.identificacion,
        tipoIdentificacion: dto.tipoIdentificacion,
        primerNombre: dto.primerNombre,
        segundoNombre: dto.segundoNombre,
        primerApellido: dto.primerApellido,
        segundoApellido: dto.segundoApellido,
        fechaNacimiento: new Date(dto.fechaNacimiento),
        sexo: dto.sexo,
        celular: dto.celular,
        correo: dto.correo,
        direccion: dto.direccion,
        estado: dto.estado ?? 'activo',
      },
    });
  }

  async findAll(empresaId: string, page = 1, limit = 20, search?: string) {
    const where: any = { empresaId };
    if (search) {
      where.OR = [
        { primerNombre: { contains: search, mode: 'insensitive' } },
        { primerApellido: { contains: search, mode: 'insensitive' } },
        { identificacion: { contains: search } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.miembro.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          rutinasAsignadas: {
            where: { fechaFin: { gte: new Date() } },
            include: { frecuencia: { select: { nombre: true } } },
            take: 1,
            orderBy: { fechaFin: 'desc' },
          },
        },
      }),
      this.prisma.miembro.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(empresaId: string, id: string) {
    return this.prisma.miembro.findFirstOrThrow({ where: { empresaId, id } });
  }

  async update(empresaId: string, id: string, dto: UpdateMiembroDto) {
    return this.prisma.miembro.update({
      where: { id },
      data: {
        identificacion: dto.identificacion,
        tipoIdentificacion: dto.tipoIdentificacion,
        primerNombre: dto.primerNombre,
        segundoNombre: dto.segundoNombre,
        primerApellido: dto.primerApellido,
        segundoApellido: dto.segundoApellido,
        fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : undefined,
        sexo: dto.sexo,
        celular: dto.celular,
        correo: dto.correo,
        direccion: dto.direccion,
        estado: dto.estado,
      },
    });
  }

  async remove(empresaId: string, id: string) {
    return this.prisma.miembro.delete({ where: { id } });
  }
}
