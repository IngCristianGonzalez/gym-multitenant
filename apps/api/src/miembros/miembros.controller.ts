import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MiembrosService } from './miembros.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { EmpresaId } from '../common/user.decorators';
import {
  CreateMiembroDto,
  UpdateMiembroDto,
  RegistroMiembroDto,
  CreateMiembroSchema,
  UpdateMiembroSchema,
  RegistroMiembroSchema,
} from '@gym/api-types';
import { ZodValidationPipe } from '../common/zod.decorator';

@Controller('miembros')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MiembrosController {
  constructor(private readonly service: MiembrosService) {}

  @Post('registro')
  @Roles('admin', 'recepcionista')
  registro(
    @EmpresaId() empresaId: string,
    @Body(new ZodValidationPipe(RegistroMiembroSchema)) dto: RegistroMiembroDto,
  ) {
    return this.service.registroCompleto(empresaId, dto);
  }

  @Post()
  @Roles('admin', 'recepcionista')
  create(
    @EmpresaId() empresaId: string,
    @Body(new ZodValidationPipe(CreateMiembroSchema)) dto: CreateMiembroDto,
  ) {
    return this.service.create(empresaId, dto);
  }

  @Get()
  @Roles('admin', 'recepcionista')
  findAll(
    @EmpresaId() empresaId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(
      empresaId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
    );
  }

  @Get(':id')
  @Roles('admin', 'recepcionista')
  findOne(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return this.service.findOne(empresaId, id);
  }

  @Put(':id')
  @Roles('admin', 'recepcionista')
  update(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateMiembroSchema)) dto: UpdateMiembroDto,
  ) {
    return this.service.update(empresaId, id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return this.service.remove(empresaId, id);
  }
}
