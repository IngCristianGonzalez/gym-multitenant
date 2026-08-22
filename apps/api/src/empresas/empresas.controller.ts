import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { EmpresaId, CurrentUser } from '../common/user.decorators';
import {
  UpdateEmpresaDto,
  UpdateEmpresaSchema,
  CreateUserDto,
  CreateUserSchema,
} from '@gym/api-types';
import { ZodValidationPipe } from '../common/zod.decorator';

@Controller('empresas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmpresasController {
  constructor(private readonly service: EmpresasService) {}

  @Get('me')
  me(@EmpresaId() empresaId: string) {
    return this.service.findById(empresaId);
  }

  @Put('me')
  @Roles('admin', 'super_admin')
  update(
    @EmpresaId() empresaId: string,
    @Body(new ZodValidationPipe(UpdateEmpresaSchema)) dto: UpdateEmpresaDto,
  ) {
    return this.service.update(empresaId, dto);
  }

  @Get('users')
  @Roles('admin', 'super_admin')
  users(@EmpresaId() empresaId: string) {
    return this.service.listUsers(empresaId);
  }

  @Post('users')
  @Roles('admin', 'super_admin')
  createUser(
    @EmpresaId() empresaId: string,
    @Body(new ZodValidationPipe(CreateUserSchema)) dto: CreateUserDto,
  ) {
    return this.service.createUser(empresaId, dto);
  }
}
