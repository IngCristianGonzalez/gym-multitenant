import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthPayload } from '@gym/api-types';

export interface AuthedUser {
  id: string;
  empresaId: string;
  rol: string;
  email: string;
}

/**
 * Extrae el usuario autenticado del request (proviene del JWT).
 * Uso: @CurrentUser() user: AuthedUser
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthedUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);

/**
 * Extrae el empresaId del usuario autenticado.
 * Uso: @EmpresaId() empresaId: string
 */
export const EmpresaId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as AuthedUser;
    if (!user?.empresaId) {
      throw new Error('Contexto de empresa no disponible');
    }
    return user.empresaId;
  },
);
