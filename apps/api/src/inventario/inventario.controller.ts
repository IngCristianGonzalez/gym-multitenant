import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventarioService } from './inventario.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { EmpresaId } from '../common/user.decorators';
import {
  CreateCategoriaDto,
  CreateCategoriaSchema,
  CreateProductoDto,
  CreateProductoSchema,
  MovimientoDto,
  MovimientoSchema,
} from '@gym/api-types';
import { ZodValidationPipe } from '../common/zod.decorator';

@Controller('inventario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventarioController {
  constructor(private readonly service: InventarioService) {}

  @Post('categorias')
  @Roles('admin')
  createCategoria(
    @EmpresaId() empresaId: string,
    @Body(new ZodValidationPipe(CreateCategoriaSchema)) dto: CreateCategoriaDto,
  ) {
    return this.service.createCategoria(empresaId, dto);
  }

  @Get('categorias')
  @Roles('admin', 'recepcionista')
  categorias(@EmpresaId() empresaId: string) {
    return this.service.findCategorias(empresaId);
  }

  @Post('productos')
  @Roles('admin')
  createProducto(
    @EmpresaId() empresaId: string,
    @Body(new ZodValidationPipe(CreateProductoSchema)) dto: CreateProductoDto,
  ) {
    return this.service.createProducto(empresaId, dto);
  }

  @Get('productos')
  @Roles('admin', 'recepcionista')
  productos(
    @EmpresaId() empresaId: string,
    @Query('bajoStock') bajoStock?: string,
  ) {
    return this.service.findProductos(empresaId, bajoStock === 'true');
  }

  @Post('movimientos')
  @Roles('admin')
  movimiento(
    @EmpresaId() empresaId: string,
    @Body(new ZodValidationPipe(MovimientoSchema)) dto: MovimientoDto,
  ) {
    return this.service.registrarMovimiento(empresaId, dto);
  }

  @Get('movimientos')
  @Roles('admin', 'recepcionista')
  movimientos(
    @EmpresaId() empresaId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findMovimientos(
      empresaId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }
}
