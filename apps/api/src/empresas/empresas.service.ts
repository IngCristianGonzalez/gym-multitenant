import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateEmpresaDto } from '@gym/api-types';

@Injectable()
export class EmpresasService {
  constructor(private prisma: PrismaService) {}

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
    const bcrypt = require('bcryptjs');
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
}
