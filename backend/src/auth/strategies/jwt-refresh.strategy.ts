import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';

export interface JwtRefreshPayload {
  sub: string;
  email: string;
  accountType: string;
  role: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- PassportStrategy mixin constructor is untyped by design
    super({
      jwtFromRequest: (req: Request): string | null => {
        const token = req?.cookies?.refresh_token as string | undefined;
        return token ?? null;
      },
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtRefreshPayload): JwtRefreshPayload {
    if (!payload?.sub) throw new UnauthorizedException('Invalid refresh token');
    return payload;
  }
}
