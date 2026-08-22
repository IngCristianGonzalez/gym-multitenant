import { z } from 'zod';

export const RegisterPrimerAdminSchema = z.object({
  nombreEmpresa: z.string().min(2).max(120),
  nit: z.string().min(5).max(20),
  nombre: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  colorPrimario: z.string().optional(),
});
export type RegisterPrimerAdminDto = z.infer<
  typeof RegisterPrimerAdminSchema
>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof LoginSchema>;

export const CreateUserSchema = z.object({
  nombre: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  rol: z.enum(['admin', 'recepcionista']),
});
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

export interface AuthPayload {
  sub: string;
  empresaId: string;
  rol: string;
  email: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    empresaId: string;
  };
}
