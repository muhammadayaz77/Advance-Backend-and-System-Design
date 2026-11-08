import { z } from "zod";

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .transform((s) => s.trim()),
  email: z
    .string()
    .email("Invalid email address")
    .transform((s) => s.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  phone: z.string().optional(),
  countryCode: z.string().optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((s) => s.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((s) => s.toLowerCase().trim()),
  code: z
    .string()
    .length(6, "Code must be exactly 6 characters")
    .transform((s) => s.toUpperCase().trim()),
});

export const resendVerificationSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((s) => s.toLowerCase().trim()),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((s) => s.toLowerCase().trim()),
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((s) => s.toLowerCase().trim()),
  token: z
    .string()
    .length(6, "Token must be exactly 6 characters")
    .transform((s) => s.toUpperCase().trim()),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export const onboardingSchema = z.object({
  accountType: z.enum(["user", "admin", "client", "freelancer"]),
  role: z.enum([
    "education",
    "blue_collar",
    "healthcare",
    "student",
    "performer",
    "other",
    "individual",
    "agency",
  ]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;

