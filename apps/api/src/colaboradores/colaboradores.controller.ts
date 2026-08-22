import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ColaboradoresService } from './colaboradores.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { EmpresaId } from '../common/user.decorators';
import {
  CreateColaboradorDto,
  UpdateColaboradorDto,
  CreateColaboradorSchema,
  UpdateColaboradorSchema,
} from '@gym/api-types';
import { ZodValidationPipe } from '../common/zod.decorator';

@Controller('colaboradores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ColaboradoresController {
  constructor(private readonly service: ColaboradoresService) {}

  @Post()
  @Roles('admin')
  create(
    @EmpresaId() empresaId: string,
    @Body(new ZodValidationPipe(CreateColaboradorSchema)) dto: CreateColaboradorDto,
  ) {
    return this.service.create(empresaId, dto);
  }

  @Get()
  @Roles('admin', 'recepcionista')
  findAll(@EmpresaId() empresaId: string) {
    return this.service.findAll(empresaId);
  }

  @Get(':id')
  @Roles('admin', 'recepcionista')
  findOne(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return this.service.findOne(empresaId, id);
  }

  @Put(':id')
  @Roles('admin')
  update(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateColaboradorSchema)) dto: UpdateColaboradorDto,
  ) {
    return this.service.update(empresaId, id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return this.service.remove(empresaId, id);
  }
}
