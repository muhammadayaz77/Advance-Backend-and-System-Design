import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // Secrets are passed explicitly per-call in AuthService.issueTokens()
    JwtModule.register({}),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    {
      provide: GoogleStrategy,
      useFactory: (configService: ConfigService): GoogleStrategy | null => {
        if (!configService.get<string>('GOOGLE_CLIENT_ID')) return null;
        return new GoogleStrategy(configService);
      },
      inject: [ConfigService],
    },
  ],
  controllers: [AuthController],
  exports: [JwtModule],
})
export class AuthModule {}
