import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { EmpresasService } from './empresas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { EmpresaId, CurrentUser, AuthedUser } from '../common/user.decorators';
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

  // ── Super Admin: list all empresas ──
  @Get('all')
  @Roles('super_admin')
  listAll() {
    return this.service.listAll();
  }

  // ── Super Admin: create empresa + admin user ──
  @Post()
  @Roles('super_admin')
  createEmpresa(
    @Body() dto: {
      nombre: string;
      nit: string;
      adminNombre: string;
      adminEmail: string;
      adminPassword: string;
      colorPrimario?: string;
    },
  ) {
    if (!dto.nombre || !dto.nit || !dto.adminNombre || !dto.adminEmail || !dto.adminPassword) {
      throw new BadRequestException('Faltan campos obligatorios');
    }
    return this.service.createEmpresa(dto);
  }

  // ── Super Admin: delete empresa ──
  @Delete(':id')
  @Roles('super_admin')
  deleteEmpresa(@Param('id') id: string) {
    return this.service.deleteEmpresa(id);
  }

  // ── Logo upload ──
  @Post('logo')
  @Roles('super_admin', 'admin')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: './uploads/logos',
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp|svg\+xml)$/)) {
          cb(new BadRequestException('Solo se permiten imagenes (jpg, png, webp, svg)'), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se envio archivo');
    return { url: `/uploads/logos/${file.filename}` };
  }

  // ── Current empresa info ──
  @Get('me')
  me(@EmpresaId() empresaId: string) {
    return this.service.findById(empresaId);
  }

  // ── Update empresa (admin of that gym) ──
  @Put('me')
  @Roles('admin', 'super_admin')
  update(
    @EmpresaId() empresaId: string,
    @Body(new ZodValidationPipe(UpdateEmpresaSchema)) dto: UpdateEmpresaDto,
  ) {
    return this.service.update(empresaId, dto);
  }

  // ── List users for current empresa ──
  @Get('users')
  @Roles('admin', 'super_admin')
  users(@EmpresaId() empresaId: string) {
    return this.service.listUsers(empresaId);
  }

  // ── Create user in current empresa ──
  @Post('users')
  @Roles('admin', 'super_admin')
  createUser(
    @EmpresaId() empresaId: string,
    @Body(new ZodValidationPipe(CreateUserSchema)) dto: CreateUserDto,
  ) {
    return this.service.createUser(empresaId, dto);
  }

  // ── Delete user ──
  @Delete('users/:id')
  @Roles('admin', 'super_admin')
  deleteUser(@Param('id') id: string) {
    return this.service.deleteUser(id);
  }
}
