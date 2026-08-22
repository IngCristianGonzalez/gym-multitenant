import { Module } from '@nestjs/common';
import { MaquinasController } from './maquinas.controller';
import { MaquinasService } from './maquinas.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [MaquinasController],
  providers: [MaquinasService, PrismaService],
})
export class MaquinasModule {}
