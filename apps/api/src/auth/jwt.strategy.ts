import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthPayload } from '@gym/api-types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: any) => req?.query?.token || null,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'gym-secret-change-me',
    });
  }

  async validate(payload: AuthPayload) {
    if (!payload.sub || !payload.empresaId || !payload.rol) {
      throw new UnauthorizedException();
    }
    return {
      id: payload.sub,
      empresaId: payload.empresaId,
      rol: payload.rol,
      email: payload.email,
    };
  }
}
