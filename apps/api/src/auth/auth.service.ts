import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import {
  LoginDto,
  RegisterPrimerAdminDto,
  AuthPayload,
  LoginResponse,
} from '@gym/api-types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async registerPrimerAdmin(dto: RegisterPrimerAdminDto): Promise<LoginResponse> {
    const existing = await this.prisma.empresa.findUnique({
      where: { nit: dto.nit },
    });
    if (existing) {
      throw new UnauthorizedException('El NIT ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const empresa = await this.prisma.empresa.create({
      data: {
        nombre: dto.nombreEmpresa,
        nit: dto.nit,
        colorPrimario: dto.colorPrimario ?? '#3b82f6',
      },
    });

    const user = await this.prisma.user.create({
      data: {
        empresaId: empresa.id,
        nombre: dto.nombre,
        email: dto.email,
        password: passwordHash,
        rol: 'super_admin',
      },
    });

    return this.buildResponse(user, empresa.id);
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return user;
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.validateUser(dto.email, dto.password);
    return this.buildResponse(user, user.empresaId);
  }

  private buildResponse(
    user: { id: string; nombre: string; email: string; rol: string; empresaId: string },
    empresaId: string,
  ): LoginResponse {
    const payload: AuthPayload = {
      sub: user.id,
      empresaId,
      rol: user.rol,
      email: user.email,
    };
    return {
      access_token: this.jwt.sign(payload),
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        empresaId,
      },
    };
  }
}
