import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RutinasService } from './rutinas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { EmpresaId } from '../common/user.decorators';
import {
  CreateRutinaDto,
  CreateRutinaSchema,
  AsignarRutinaDto,
  AsignarRutinaSchema,
} from '@gym/api-types';
import { ZodValidationPipe } from '../common/zod.decorator';

@Controller('rutinas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RutinasController {
  constructor(private readonly service: RutinasService) {}

  @Post()
  @Roles('admin')
  create(
    @EmpresaId() empresaId: string,
    @Body(new ZodValidationPipe(CreateRutinaSchema)) dto: CreateRutinaDto,
  ) {
    return this.service.createRutina(empresaId, dto);
  }

  @Get()
  @Roles('admin', 'recepcionista')
  findAll(@EmpresaId() empresaId: string) {
    return this.service.findAll(empresaId);
  }

  @Post('asignar')
  @Roles('admin', 'recepcionista')
  asignar(
    @EmpresaId() empresaId: string,
    @Body(new ZodValidationPipe(AsignarRutinaSchema)) dto: AsignarRutinaDto,
  ) {
    return this.service.asignar(empresaId, dto);
  }

  @Get('asignaciones')
  @Roles('admin', 'recepcionista')
  asignaciones(
    @EmpresaId() empresaId: string,
    @Query('miembroId') miembroId?: string,
  ) {
    return this.service.findAsignaciones(empresaId, miembroId);
  }
}
