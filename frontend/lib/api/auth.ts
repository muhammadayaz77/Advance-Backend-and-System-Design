/**
 * All authentication API calls in one place.
 *
 * Every function returns the unwrapped `data` value already; callers never
 * need to inspect response envelopes or HTTP status codes.
 */

import { apiRequest } from "@/lib/api-client";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from "@/lib/validations/auth";

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
}

export interface MessageResponse {
  message: string;
}

// ─── Shared option: these endpoints are public, no Bearer header needed ────────

const PUBLIC = { skipAuth: true } as const;

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  login: (data: LoginInput) =>
    apiRequest<AuthTokens>("POST", "/auth/login", data, PUBLIC),

  register: (data: RegisterInput) =>
    apiRequest<MessageResponse>("POST", "/auth/register", data, PUBLIC),

  verifyEmail: (data: { email: string } & VerifyEmailInput) =>
    apiRequest<MessageResponse>("POST", "/auth/verify-email", data, PUBLIC),

  resendVerification: (data: { email: string }) =>
    apiRequest<MessageResponse>(
      "POST",
      "/auth/resend-verification",
      data,
      PUBLIC,
    ),

  forgotPassword: (data: ForgotPasswordInput) =>
    apiRequest<MessageResponse>("POST", "/auth/forgot-password", data, PUBLIC),

  /** Send email + reset token + new password to complete the reset. */
  resetPassword: (
    data: { email: string; token: string } & Omit<
      ResetPasswordInput,
      "confirmPassword"
    >,
  ) =>
    apiRequest<MessageResponse>("POST", "/auth/reset-password", data, PUBLIC),

  completeOnboarding: (data: { accountType: string; role: string }) =>
    apiRequest<AuthTokens>("PATCH", "/auth/onboarding", data),

  refresh: () => apiRequest<AuthTokens>("POST", "/auth/refresh", undefined, PUBLIC),

  logout: () => apiRequest<void>("POST", "/auth/logout", undefined, PUBLIC),

  /** Permanently deletes the account and all related data on the server. */
  deleteAccount: () =>
    apiRequest<MessageResponse>("DELETE", "/auth/account"),
} as const;
