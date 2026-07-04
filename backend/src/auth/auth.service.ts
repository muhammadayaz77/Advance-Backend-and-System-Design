import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccountType, AuthProvider, UserRole } from '@prisma/client';
import { hash, verify as argonVerify } from 'argon2';
import { randomBytes } from 'crypto';
import type { StringValue } from 'ms';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { GoogleProfile } from './strategies/google.strategy';
import type { JwtRefreshPayload } from './strategies/jwt-refresh.strategy';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly cloudinary: CloudinaryService,
  ) { }

  // ─── Registration ─────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        countryCode: dto.countryCode,
        authProvider: AuthProvider.email,
        profile: { create: {} },
      },
      select: { id: true, email: true, fullName: true },
    });

    await this.sendVerificationCode(user.id, user.email, user.fullName);

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  // ─── Email/Password Login ─────────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Always perform a hash operation to prevent timing-based user enumeration
    if (!user || !user.passwordHash) {
      await hash(dto.password);
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await argonVerify(user.passwordHash, dto.password);
    if (!isValid) throw new UnauthorizedException('Invalid email or password');

    if (user.status !== 'active') {
      throw new UnauthorizedException('Your account has been deactivated');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email address before logging in',
      );
    }

    return this.issueTokens(
      user.id,
      user.email,
      user.accountType,
      user.role,
      user.onboardingCompleted,
    );
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────────

  async googleLogin(googleProfile: GoogleProfile): Promise<TokenPair> {
    // 1. Try to find an already-linked Google account
    let user = await this.prisma.user.findUnique({
      where: { googleId: googleProfile.googleId },
    });

    if (!user) {
      // 2. Check for an existing email account and link it
      const emailUser = await this.prisma.user.findUnique({
        where: { email: googleProfile.email },
      });

      if (emailUser) {
        user = await this.prisma.user.update({
          where: { id: emailUser.id },
          data: { googleId: googleProfile.googleId, emailVerified: true },
        });
      } else {
        // 3. Brand-new user via Google — onboarding flow will complete accountType/role
        user = await this.prisma.user.create({
          data: {
            fullName: googleProfile.fullName,
            email: googleProfile.email,
            googleId: googleProfile.googleId,
            authProvider: AuthProvider.google,
            emailVerified: true,
            profile: { create: { avatarUrl: googleProfile.avatarUrl } },
          },
        });
      }
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Your account has been deactivated');
    }

    return this.issueTokens(
      user.id,
      user.email,
      user.accountType,
      user.role,
      user.onboardingCompleted,
    );
  }

  // ─── Token Refresh ────────────────────────────────────────────────────────────

  async refreshTokens(payload: JwtRefreshPayload): Promise<TokenPair> {
    // Re-fetch user to catch any status changes since the token was issued
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        accountType: true,
        role: true,
        onboardingCompleted: true,
        status: true,
      },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Session is no longer valid');
    }

    return this.issueTokens(
      user.id,
      user.email,
      user.accountType,
      user.role,
      user.onboardingCompleted,
    );
  }

  // ─── Email Verification ───────────────────────────────────────────────────────

  async verifyEmail(email: string, code: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Invalid request');
    if (user.emailVerified) {
      throw new BadRequestException('This email address is already verified');
    }

    const record = await this.prisma.emailVerification.findFirst({
      where: { userId: user.id, code, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) throw new BadRequestException('Invalid verification code');
    if (record.expiresAt < new Date()) {
      throw new BadRequestException(
        'Verification code has expired. Please request a new one.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.emailVerification.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      }),
    ]);

    return { message: 'Email verified successfully. You can now log in.' };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    // Always return the same message to avoid leaking whether an account exists
    const genericResponse = {
      message:
        'If that account exists and is unverified, a new code has been sent.',
    };

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) return genericResponse;

    await this.sendVerificationCode(user.id, user.email, user.fullName);
    return genericResponse;
  }

  // ─── Password Reset ───────────────────────────────────────────────────────────

  async forgotPassword(email: string): Promise<{ message: string }> {
    const genericResponse = {
      message:
        'If that account exists, a password reset link has been sent to your email.',
    };

    const user = await this.prisma.user.findUnique({ where: { email } });

    // Only email-auth accounts can reset passwords; never leak user existence
    if (!user || user.authProvider !== AuthProvider.email) {
      return genericResponse;
    }

    const code = this.generateCode(6);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.passwordReset.create({
      data: { userId: user.id, code, expiresAt },
    });

    const clientUrl = this.config.getOrThrow<string>('CLIENT_URL');
    const resetUrl = new URL('/reset-password', clientUrl);
    resetUrl.searchParams.set('email', user.email);
    resetUrl.searchParams.set('token', code);

    await this.mail.sendPasswordReset(
      user.email,
      user.fullName,
      resetUrl.toString(),
    );

    return genericResponse;
  }

  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Invalid request');

    const record = await this.prisma.passwordReset.findFirst({
      where: { userId: user.id, code: token, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired password reset code');
    }
    if (record.expiresAt < new Date()) {
      throw new BadRequestException(
        'Reset code has expired. Please request a new one.',
      );
    }

    const passwordHash = await hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.passwordReset.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
    ]);

    return {
      message:
        'Password reset successful. You can now log in with your new password.',
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────────

  private async sendVerificationCode(
    userId: string,
    email: string,
    fullName: string,
  ): Promise<void> {
    const code = this.generateCode(6);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.emailVerification.create({
      data: { userId, code, expiresAt },
    });

    await this.mail.sendVerification(email, fullName, code);
  }

  // ─── Onboarding ───────────────────────────────────────────────────────────────

  async completeOnboarding(
    userId: string,
    accountType: AccountType,
    role: UserRole,
  ): Promise<TokenPair> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        accountType,
        role,
        onboardingCompleted: true,
      },
      select: {
        id: true,
        email: true,
        accountType: true,
        role: true,
        onboardingCompleted: true,
      },
    });

    return this.issueTokens(
      user.id,
      user.email,
      user.accountType,
      user.role,
      user.onboardingCompleted,
    );
  }

  /**
   * Permanently deletes the user row. Related rows cascade in PostgreSQL
   * (profiles, jobs, gigs, applications, contracts, payments, etc.).
   * Uploaded Cloudinary assets are removed best-effort before the DB delete.
   */
  async deleteAccount(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Best-effort: remove avatar from Cloudinary before deleting the user row
    if (user.profile?.avatarUrl) {
      await this.cloudinary.destroyBySecureUrl(user.profile.avatarUrl);
    }

    await this.prisma.user.delete({ where: { id: userId } });

    return {
      message:
        'Your account and all associated data have been permanently deleted.',
    };
  }

  private async issueTokens(
    userId: string,
    email: string,
    accountType: AccountType,
    role: UserRole,
    onboardingCompleted: boolean,
  ): Promise<TokenPair> {
    const payload = {
      sub: userId,
      email,
      accountType,
      role,
      onboardingCompleted,
    };

    const accessExpiry = (this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ??
      '15m') as StringValue;
    const refreshExpiry = (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ??
      '7d') as StringValue;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiry,
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiry,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Generates a cryptographically secure uppercase alphanumeric OTP.
   * Excludes visually ambiguous characters (I, O, 0, 1).
   */
  private generateCode(length: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = randomBytes(length);
    return Array.from(bytes)
      .map((b) => chars[b % chars.length])
      .join('');
  }
}
