/**
 * Shared Zod schemas for all auth forms.
 *
 * Single source of truth — imported by every page and the API layer.
 * Rules mirror the backend DTOs so validation is consistent on both sides.
 */

import * as z from "zod/v3";

// ─── Re-usable building block ────────────────────────────────────────────────────

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number");

// ─── Schemas ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: passwordSchema,
  phone: z.string().optional(),
  countryCode: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const verifyEmailSchema = z.object({
  code: z.string().length(6, "OTP must be exactly 6 characters").toUpperCase(),
});

// ─── Inferred TypeScript types ────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

// ─── Display labels for enums (used in forms) ─────────────────────────────────────

export const ACCOUNT_TYPE_LABELS: Record<"client" | "freelancer", string> = {
  client: "Client – I want to hire",
  freelancer: "Freelancer – I want to work",
};

export const ROLE_LABELS: Record<
  | "education"
  | "blue_collar"
  | "healthcare"
  | "student"
  | "performer"
  | "other",
  string
> = {
  education: "Education",
  blue_collar: "Blue Collar",
  healthcare: "Healthcare",
  student: "Student",
  performer: "Performer",
  other: "Other",
};
