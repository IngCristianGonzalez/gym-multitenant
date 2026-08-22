import { Module } from '@nestjs/common';
import { RutinasController } from './rutinas.controller';
import { RutinasService } from './rutinas.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [RutinasController],
  providers: [RutinasService, PrismaService],
})
export class RutinasModule {}
