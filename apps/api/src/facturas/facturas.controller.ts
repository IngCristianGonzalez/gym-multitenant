import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { FacturasService } from './facturas.service';
import { PdfService } from './pdf.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { EmpresaId } from '../common/user.decorators';
import {
  EmitirFacturaDto,
  EmitirFacturaSchema,
} from '@gym/api-types';
import { ZodValidationPipe } from '../common/zod.decorator';

@Controller('facturas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FacturasController {
  constructor(
    private readonly service: FacturasService,
    private readonly pdf: PdfService,
  ) {}

  @Post('emitir')
  @Roles('admin', 'recepcionista')
  emitir(
    @EmpresaId() empresaId: string,
    @Body(new ZodValidationPipe(EmitirFacturaSchema)) dto: EmitirFacturaDto,
  ) {
    return this.service.emitir(empresaId, dto);
  }

  @Get()
  @Roles('admin', 'recepcionista')
  findAll(
    @EmpresaId() empresaId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(
      empresaId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get(':id')
  @Roles('admin', 'recepcionista')
  findOne(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return this.service.findOne(empresaId, id);
  }

  @Post(':id/anular')
  @Roles('admin')
  anular(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() body: { motivo?: string },
  ) {
    return this.service.anular(empresaId, id, body?.motivo);
  }

  @Get(':id/pdf')
  @Roles('admin', 'recepcionista')
  async pdfFactura(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const factura = await this.service.findOne(empresaId, id);
    const doc = this.pdf.generarFactura(factura);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename=factura-${factura.numeroFactura}.pdf`,
    );
    doc.pipe(res);
    doc.end();
  }
}
