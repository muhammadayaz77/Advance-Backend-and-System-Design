import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { JwtRefreshGuard } from '../common/guards/jwt-refresh.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import type { JwtRefreshPayload } from './strategies/jwt-refresh.strategy';
import type { GoogleProfile } from './strategies/google.strategy';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  // ─── Email/Password ───────────────────────────────────────────────────────────

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(dto);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  // ─── Email Verification ───────────────────────────────────────────────────────

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.email, dto.code);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  // ─── Password Reset ───────────────────────────────────────────────────────────

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(
      dto.email,
      dto.token,
      dto.newPassword,
    );
  }

  /** Complete onboarding: set accountType, role and issue a fresh token pair. */
  @HttpCode(HttpStatus.OK)
  @Patch('onboarding')
  async completeOnboarding(
    @CurrentUser() user: { id: string },
    @Body() dto: CompleteOnboardingDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.completeOnboarding(
        user.id,
        dto.accountType,
        dto.role,
      );
    this.setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  // ─── Token Management ─────────────────────────────────────────────────────────

  /** Refresh access token using the httpOnly refresh_token cookie. */
  @Public()
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @CurrentUser() payload: JwtRefreshPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.refreshTokens(payload);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token', { path: '/' });
    return { message: 'Logged out successfully' };
  }

  /** Permanently delete the signed-in account and all related data. */
  @HttpCode(HttpStatus.OK)
  @Delete('account')
  async deleteAccount(
    @CurrentUser() user: { id: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.deleteAccount(user.id);
    res.clearCookie('refresh_token', { path: '/' });
    return result;
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────────

  /** Initiates the Google OAuth flow — Passport redirects to Google. */
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleInitiate(): void {
    // Intentionally empty — Passport handles the redirect
  }

  /** Google redirects back here after the user grants access. */
  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { accessToken, refreshToken } = await this.authService.googleLogin(
      req.user as GoogleProfile,
    );

    this.setRefreshCookie(res, refreshToken);

    const clientUrl = this.config.getOrThrow<string>('CLIENT_URL');

    // Use URL fragment (#) so the token is never forwarded to any server
    res.redirect(`${clientUrl}/auth/callback#token=${accessToken}`);
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────────

  private setRefreshCookie(res: Response, token: string): void {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';

    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      path: '/',
    });
  }
}
