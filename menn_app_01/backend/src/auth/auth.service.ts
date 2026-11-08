import crypto from "crypto";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { Response } from "express";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { sendVerification, sendPasswordReset } from "../mail/mail.service.js";
import { destroyBySecureUrl } from "../cloudinary/cloudinary.service.js";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} from "../lib/errors.js";
import type {
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  ResendVerificationInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  OnboardingInput,
} from "./auth.schemas.js";
import type { AccountType, UserRole } from "@prisma/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function generateCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // excludes I, O, 0, 1
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie("refresh_token", { path: "/" });
}

export function issueTokens(
  userId: string,
  email: string,
  accountType: AccountType | null,
  role: UserRole | null,
  onboardingCompleted: boolean
): { accessToken: string; refreshToken: string } {
  const payload = {
    sub: userId,
    email,
    accountType,
    role,
    onboardingCompleted,
  };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

  return { accessToken, refreshToken };
}

// ─── Service Methods ──────────────────────────────────────────────────────────

export async function register(dto: RegisterInput): Promise<{ message: string }> {
  const { fullName, email, password, phone, countryCode } = dto;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const passwordHash = await argon2.hash(password);
  const code = generateCode(6);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        phone,
        countryCode,
        authProvider: "email",
        profile: {
          create: {},
        },
      },
    });

    await tx.emailVerification.create({
      data: {
        userId: user.id,
        code,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });
  });

  // Non-blocking email send
  void sendVerification(email, fullName, code);

  return {
    message: "Registration successful. Please check your email to verify your account.",
  };
}

export async function login(
  dto: LoginInput,
  res: Response
): Promise<{ accessToken: string }> {
  const { email, password } = dto;

  const user = await prisma.user.findUnique({ where: { email } });

  // Timing-attack prevention: always run hash if user not found or no passwordHash
  if (!user || !user.passwordHash) {
    await argon2.hash(password);
    throw new UnauthorizedError("Invalid email or password");
  }

  const isValid = await argon2.verify(user.passwordHash, password);
  if (!isValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (user.status !== "active") {
    throw new UnauthorizedError("Your account has been deactivated");
  }

  if (!user.emailVerified) {
    throw new UnauthorizedError("Please verify your email address before logging in");
  }

  const { accessToken, refreshToken } = issueTokens(
    user.id,
    user.email,
    user.accountType,
    user.role,
    user.onboardingCompleted
  );

  setRefreshCookie(res, refreshToken);

  return { accessToken };
}

export async function googleLogin(
  profile: {
    googleId: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  },
  res: Response
): Promise<{ accessToken: string }> {
  let user = await prisma.user.findUnique({
    where: { googleId: profile.googleId },
  });

  if (!user) {
    user = await prisma.user.findUnique({ where: { email: profile.email } });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.googleId,
          emailVerified: true,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          googleId: profile.googleId,
          email: profile.email,
          fullName: profile.fullName,
          authProvider: "google",
          emailVerified: true,
          profile: {
            create: {
              avatarUrl: profile.avatarUrl,
            },
          },
        },
      });
    }
  }

  if (user.status !== "active") {
    throw new UnauthorizedError("Your account has been deactivated");
  }

  const { accessToken, refreshToken } = issueTokens(
    user.id,
    user.email,
    user.accountType,
    user.role,
    user.onboardingCompleted
  );

  setRefreshCookie(res, refreshToken);

  return { accessToken };
}

export async function verifyEmail(
  dto: VerifyEmailInput
): Promise<{ message: string }> {
  const { email, code } = dto;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new BadRequestError("Invalid verification code");
  }

  if (user.emailVerified) {
    throw new BadRequestError("This email address is already verified");
  }

  const verification = await prisma.emailVerification.findFirst({
    where: {
      userId: user.id,
      code,
      usedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!verification) {
    throw new BadRequestError("Invalid verification code");
  }

  if (verification.expiresAt < new Date()) {
    throw new BadRequestError(
      "Verification code has expired. Please request a new one."
    );
  }

  await prisma.$transaction([
    prisma.emailVerification.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    }),
  ]);

  return { message: "Email verified successfully. You can now log in." };
}

export async function resendVerification(
  dto: ResendVerificationInput
): Promise<{ message: string }> {
  const genericResponse = {
    message: "If that account exists and is unverified, a new code has been sent.",
  };

  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user || user.emailVerified) {
    return genericResponse;
  }

  const code = generateCode(6);

  await prisma.emailVerification.create({
    data: {
      userId: user.id,
      code,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  void sendVerification(user.email, user.fullName, code);

  return genericResponse;
}

export async function forgotPassword(
  dto: ForgotPasswordInput
): Promise<{ message: string }> {
  const genericResponse = {
    message: "If that account exists, a password reset link has been sent to your email.",
  };

  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user || user.authProvider !== "email") {
    return genericResponse;
  }

  const code = generateCode(6);

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      code,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    },
  });

  const resetLink = `${env.CLIENT_URL}/reset-password?email=${encodeURIComponent(user.email)}&token=${code}`;
  void sendPasswordReset(user.email, user.fullName, resetLink);

  return genericResponse;
}

export async function resetPassword(
  dto: ResetPasswordInput
): Promise<{ message: string }> {
  const { email, token, newPassword } = dto;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new BadRequestError("Invalid or expired password reset code");
  }

  const resetRecord = await prisma.passwordReset.findFirst({
    where: {
      userId: user.id,
      code: token,
      usedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!resetRecord) {
    throw new BadRequestError("Invalid or expired password reset code");
  }

  if (resetRecord.expiresAt < new Date()) {
    throw new BadRequestError(
      "Reset code has expired. Please request a new one."
    );
  }

  const passwordHash = await argon2.hash(newPassword);

  await prisma.$transaction([
    prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
  ]);

  return {
    message: "Password reset successful. You can now log in with your new password.",
  };
}

export async function completeOnboarding(
  userId: string,
  dto: OnboardingInput,
  res: Response
): Promise<{ accessToken: string }> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      accountType: dto.accountType as AccountType,
      role: dto.role as UserRole,
      onboardingCompleted: true,
    },
  });

  const { accessToken, refreshToken } = issueTokens(
    user.id,
    user.email,
    user.accountType,
    user.role,
    user.onboardingCompleted
  );

  setRefreshCookie(res, refreshToken);

  return { accessToken };
}

export async function refreshTokens(
  payload: { sub: string },
  res: Response
): Promise<{ accessToken: string }> {
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user || user.status !== "active") {
    throw new UnauthorizedError("Session is no longer valid");
  }

  const { accessToken, refreshToken } = issueTokens(
    user.id,
    user.email,
    user.accountType,
    user.role,
    user.onboardingCompleted
  );

  setRefreshCookie(res, refreshToken);

  return { accessToken };
}

export async function deleteAccount(
  userId: string,
  res: Response
): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (user.profile?.avatarUrl) {
    await destroyBySecureUrl(user.profile.avatarUrl);
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  clearRefreshCookie(res);

  return {
    message: "Your account and all associated data have been permanently deleted.",
  };
}

export function logout(res: Response): { message: string } {
  clearRefreshCookie(res);
  return { message: "Logged out successfully" };
}
