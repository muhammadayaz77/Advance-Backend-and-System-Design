"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "../../lib/api/auth";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "../../lib/validations/auth";
import { ApiError } from "../../lib/api-client";

/* Shared input class to avoid repetition */
const inputBase =
  "h-10 w-full px-3 rounded-md border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:ring-1 focus:ring-ring focus:border-ring";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlEmail = searchParams.get("email") ?? "";
  const urlToken = searchParams.get("token") ?? "";

  const [email, setEmail] = useState(urlEmail);
  const [token, setToken] = useState(urlToken);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(data: ResetPasswordFormData) {
    setGlobalError(null);

    if (!email.trim()) {
      setGlobalError("Please provide your email address.");
      return;
    }
    if (!token.trim()) {
      setGlobalError("Please provide the reset code or token.");
      return;
    }

    try {
      await authApi.resetPassword({
        email: email.trim(),
        token: token.trim(),
        newPassword: data.newPassword,
      });

      setSuccess("Password reset successfully! Redirecting to sign in…");
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        setGlobalError(err.message);
      } else {
        setGlobalError(
          "Failed to reset password. The code may be invalid or expired."
        );
      }
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-10 sm:px-6">
      <div className="w-full max-w-[420px] bg-card border border-border rounded-lg p-6 sm:p-8 shadow-sm">

        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-7 h-7 bg-primary text-primary-foreground rounded flex items-center justify-center text-sm font-bold">
            B
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight">
            BlogApp
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-semibold text-foreground text-center tracking-tight mb-1">
          Create new password
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Choose a strong password with at least 8 characters
        </p>

        {/* Error Alert */}
        {globalError && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-md bg-destructive/10 border border-destructive/25 text-destructive text-sm">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{globalError}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-md bg-success/10 border border-success/25 text-success text-sm">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

          {/* Email — pre-filled from query param, editable */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reset-email" className="text-sm font-medium text-foreground">
              Email address
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputBase + " border-input"}
              required
            />
          </div>

          {/* Reset Code / Token */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reset-token" className="text-sm font-medium text-foreground">
              Reset code
            </label>
            <input
              id="reset-token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter 6-character code"
              className={inputBase + " border-input font-mono tracking-widest"}
              required
            />
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-password" className="text-sm font-medium text-foreground">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={`${inputBase} ${
                errors.newPassword
                  ? "border-destructive focus:ring-destructive"
                  : "border-input"
              }`}
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={`${inputBase} ${
                errors.confirmPassword
                  ? "border-destructive focus:ring-destructive"
                  : "border-input"
              }`}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !!success}
            className="w-full h-10 flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && (
              <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isSubmitting ? "Updating password…" : "Reset password"}
          </button>

          <p className="text-sm text-muted-foreground text-center pt-1">
            Never mind?{" "}
            <Link
              href="/login"
              className="text-foreground font-medium underline underline-offset-4 hover:text-primary transition-colors"
            >
              Return to sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-background">
          <svg className="w-6 h-6 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
