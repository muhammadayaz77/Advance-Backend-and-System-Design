import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Guard for the /auth/refresh endpoint — validates the httpOnly refresh token cookie. */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}



