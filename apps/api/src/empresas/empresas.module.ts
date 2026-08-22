import { Module } from '@nestjs/common';
import { EmpresasController } from './empresas.controller';
import { EmpresasService } from './empresas.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [EmpresasController],
  providers: [EmpresasService, PrismaService],
  exports: [EmpresasService],
})
export class EmpresasModule {}
