import { Module } from '@nestjs/common';
import { FacturasController } from './facturas.controller';
import { FacturasService } from './facturas.service';
import { PdfService } from './pdf.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [FacturasController],
  providers: [FacturasService, PdfService, PrismaService],
})
export class FacturasModule {}
