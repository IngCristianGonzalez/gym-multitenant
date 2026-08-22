import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Put,
  UseGuards,
} from '@nestjs/common';
import { MaquinasService } from './maquinas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { EmpresaId } from '../common/user.decorators';
import {
  CreateMaquinaDto,
  CreateMaquinaSchema,
  CreateEjercicioDto,
  CreateEjercicioSchema,
} from '@gym/api-types';
import { ZodValidationPipe } from '../common/zod.decorator';

@Controller('maquinas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaquinasController {
  constructor(private readonly service: MaquinasService) {}

  @Post()
  @Roles('admin')
  create(
    @EmpresaId() empresaId: string,
    @Body(new ZodValidationPipe(CreateMaquinaSchema)) dto: CreateMaquinaDto,
  ) {
    return this.service.createMaquina(empresaId, dto);
  }

  @Get()
  @Roles('admin', 'recepcionista')
  findAll(@EmpresaId() empresaId: string, @Query('estado') estado?: string) {
    return this.service.findMaquinas(empresaId, estado);
  }

  @Put(':id/estado')
  @Roles('admin')
  updateEstado(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() body: { estado: string },
  ) {
    return this.service.updateEstado(empresaId, id, body.estado);
  }

  @Post('ejercicios')
  @Roles('admin')
  createEjercicio(
    @EmpresaId() empresaId: string,
    @Body(new ZodValidationPipe(CreateEjercicioSchema)) dto: CreateEjercicioDto,
  ) {
    return this.service.createEjercicio(empresaId, dto);
  }

  @Get('ejercicios')
  @Roles('admin', 'recepcionista')
  ejercicios(@EmpresaId() empresaId: string) {
    return this.service.findEjercicios(empresaId);
  }
}
