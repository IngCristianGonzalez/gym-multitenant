import { Module } from '@nestjs/common';
import { MiembrosController } from './miembros.controller';
import { MiembrosService } from './miembros.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [MiembrosController],
  providers: [MiembrosService, PrismaService],
})
export class MiembrosModule {}
