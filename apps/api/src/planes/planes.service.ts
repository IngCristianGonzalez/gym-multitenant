import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from '@gym/api-types';

@Injectable()
export class PlanesService {
  constructor(private prisma: PrismaService) {}

  create(empresaId: string, dto: CreatePlanDto) {
    return this.prisma.plan.create({
      data: { empresaId, ...dto },
    });
  }

  findAll(empresaId: string) {
    return this.prisma.plan.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
    });
  }

  update(empresaId: string, id: string, dto: CreatePlanDto) {
    return this.prisma.plan.update({ where: { id }, data: dto });
  }

  remove(empresaId: string, id: string) {
    return this.prisma.plan.delete({ where: { id } });
  }
}
