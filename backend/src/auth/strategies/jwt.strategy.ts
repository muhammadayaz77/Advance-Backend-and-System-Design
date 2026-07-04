import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  accountType: string;
  role: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  accountType: string;
  role: string;
  status: string;
  emailVerified: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- PassportStrategy mixin constructor is untyped by design
    super({
      jwtFromRequest: (req: Request): string | null => {
        const auth = req.headers.authorization;
        if (!auth?.startsWith('Bearer ')) return null;
        return auth.slice(7);
      },
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {


    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
        accountType: true,
        role: true,
        status: true,
        emailVerified: true,
      },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    return user;
  }
}
