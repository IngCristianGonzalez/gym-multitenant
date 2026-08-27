import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateEmpresaDto } from '@gym/api-types';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class EmpresasService {
  constructor(private prisma: PrismaService) {}

  /** List all empresas (super_admin only) */
  async listAll() {
    return this.prisma.empresa.findMany({
      select: {
        id: true,
        nombre: true,
        nit: true,
        logoUrl: true,
        colorPrimario: true,
        createdAt: true,
        _count: { select: { users: true, miembros: true, facturas: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Create a new empresa + its admin user (super_admin only) */
  async createEmpresa(dto: {
    nombre: string;
    nit: string;
    adminNombre: string;
    adminEmail: string;
    adminPassword: string;
    colorPrimario?: string;
  }) {
    const existing = await this.prisma.empresa.findUnique({
      where: { nit: dto.nit },
    });
    if (existing) throw new ConflictException('El NIT ya esta registrado');

    const emailExists = await this.prisma.user.findFirst({
      where: { email: dto.adminEmail },
    });
    if (emailExists) throw new ConflictException('El email ya esta registrado');

    const passwordHash = await bcrypt.hash(dto.adminPassword, 10);

    return this.prisma.$transaction(async (tx) => {
      const empresa = await tx.empresa.create({
        data: {
          nombre: dto.nombre,
          nit: dto.nit,
          colorPrimario: dto.colorPrimario ?? '#2b8a3e',
        },
      });

      const user = await tx.user.create({
        data: {
          empresaId: empresa.id,
          nombre: dto.adminNombre,
          email: dto.adminEmail,
          password: passwordHash,
          rol: 'admin',
        },
        select: { id: true, nombre: true, email: true, rol: true },
      });

      return { empresa, admin: user };
    });
  }

  /** Delete an empresa and all its data (super_admin only) */
  async deleteEmpresa(empresaId: string) {
    return this.prisma.empresa.delete({ where: { id: empresaId } });
  }

  async update(empresaId: string, dto: UpdateEmpresaDto) {
    return this.prisma.empresa.update({
      where: { id: empresaId },
      data: {
        nombre: dto.nombre,
        logoUrl: dto.logoUrl,
        colorPrimario: dto.colorPrimario,
        resolucionFactura: dto.resolucionFactura,
        prefijoFactura: dto.prefijoFactura,
        config: dto.config as object | undefined,
      },
    });
  }

  async findById(empresaId: string) {
    return this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: {
        id: true,
        nombre: true,
        nit: true,
        logoUrl: true,
        colorPrimario: true,
        resolucionFactura: true,
        prefijoFactura: true,
      },
    });
  }

  async listUsers(empresaId: string) {
    return this.prisma.user.findMany({
      where: { empresaId },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        createdAt: true,
      },
    });
  }

  async createUser(empresaId: string, dto: any) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        empresaId,
        nombre: dto.nombre,
        email: dto.email,
        password: passwordHash,
        rol: dto.rol,
      },
      select: { id: true, nombre: true, email: true, rol: true },
    });
  }

  async deleteUser(userId: string) {
    return this.prisma.user.delete({ where: { id: userId } });
  }
}
