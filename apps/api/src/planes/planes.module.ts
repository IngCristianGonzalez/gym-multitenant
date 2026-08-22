import { Module } from '@nestjs/common';
import { PlanesController } from './planes.controller';
import { PlanesService } from './planes.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PlanesController],
  providers: [PlanesService, PrismaService],
})
export class PlanesModule {}
