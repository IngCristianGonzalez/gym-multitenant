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
import { PlanesService } from './planes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { EmpresaId } from '../common/user.decorators';
import { CreatePlanDto, CreatePlanSchema } from '@gym/api-types';
import { ZodValidationPipe } from '../common/zod.decorator';

@Controller('planes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlanesController {
  constructor(private readonly service: PlanesService) {}

  @Post()
  @Roles('admin')
  create(
    @EmpresaId() empresaId: string,
    @Body(new ZodValidationPipe(CreatePlanSchema)) dto: CreatePlanDto,
  ) {
    return this.service.create(empresaId, dto);
  }

  @Get()
  @Roles('admin', 'recepcionista')
  findAll(@EmpresaId() empresaId: string) {
    return this.service.findAll(empresaId);
  }

  @Put(':id')
  @Roles('admin')
  update(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreatePlanSchema)) dto: CreatePlanDto,
  ) {
    return this.service.update(empresaId, id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@EmpresaId() empresaId: string, @Param('id') id: string) {
    return this.service.remove(empresaId, id);
  }
}
