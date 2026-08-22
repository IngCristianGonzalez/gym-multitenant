import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from './config.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { EmpresaId } from '../common/user.decorators';
import { UpsertConfigCampoDto, UpsertConfigCampoSchema } from '@gym/api-types';
import { ZodValidationPipe } from '../common/zod.decorator';

@Controller('config')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConfigController {
  constructor(private readonly service: ConfigService) {}

  @Get('dashboard')
  @Roles('admin', 'recepcionista')
  dashboard(@EmpresaId() empresaId: string) {
    return this.service.dashboard(empresaId);
  }

  @Get('campos')
  @Roles('admin', 'recepcionista')
  campos(@EmpresaId() empresaId: string, @Query('entidad') entidad?: string) {
    return this.service.getCampos(empresaId, entidad);
  }

  @Post('campos')
  @Roles('admin')
  upsert(
    @EmpresaId() empresaId: string,
    @Body(new ZodValidationPipe(UpsertConfigCampoSchema)) dto: UpsertConfigCampoDto,
  ) {
    return this.service.upsertCampo(empresaId, dto);
  }
}
