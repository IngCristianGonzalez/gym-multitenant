import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  LoginDto,
  RegisterPrimerAdminDto,
  LoginSchema,
  RegisterPrimerAdminSchema,
  LoginResponse,
} from '@gym/api-types';
import { ZodValidationPipe } from '../common/zod.decorator';
import { TenantStore } from '../common/tenant.store';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register-primer-admin')
  registerPrimerAdmin(
    @Body(new ZodValidationPipe(RegisterPrimerAdminSchema))
    dto: RegisterPrimerAdminDto,
  ): Promise<LoginResponse> {
    return this.auth.registerPrimerAdmin(dto);
  }

  @Post('login')
  async login(
    @Request() req: any,
    @Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto,
  ): Promise<LoginResponse> {
    const res = await this.auth.login(dto);
    // after login, contextualize tenant for logging purposes only
    TenantStore.set(req, {
      empresaId: res.user.empresaId,
      userId: res.user.id,
      rol: res.user.rol,
    });
    return res;
  }

  @Post('me')
  @UseGuards(JwtAuthGuard)
  me(@Request() req: any) {
    return req.user;
  }
}
