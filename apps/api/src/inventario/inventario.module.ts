import { Module } from '@nestjs/common';
import { InventarioController } from './inventario.controller';
import { InventarioService } from './inventario.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [InventarioController],
  providers: [InventarioService, PrismaService],
})
export class InventarioModule {}
