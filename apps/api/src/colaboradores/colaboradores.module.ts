import { Module } from '@nestjs/common';
import { ColaboradoresController } from './colaboradores.controller';
import { ColaboradoresService } from './colaboradores.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ColaboradoresController],
  providers: [ColaboradoresService, PrismaService],
})
export class ColaboradoresModule {}
