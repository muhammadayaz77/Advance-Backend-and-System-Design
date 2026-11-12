"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "../../lib/api/auth";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "../../lib/validations/auth";
import { ApiError } from "../../lib/api-client";

export default function ForgotPasswordPage() {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const enteredEmail = watch("email");

  async function onSubmit(data: ForgotPasswordFormData) {
    setGlobalError(null);
    setSuccessMessage(null);
    try {
      const res = await authApi.forgotPassword(data);
      setSuccessMessage(
        res.message ||
          "If an account exists for this email, a password reset link has been sent."
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setGlobalError(err.message);
      } else {
        setGlobalError("An unexpected error occurred. Please try again.");
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
          Reset password
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Enter your account email to receive a password recovery link
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

        {/* After email sent — success state */}
        {successMessage ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-md bg-success/10 border border-success/25 text-success text-sm">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMessage}</span>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Check your inbox for a password reset email. If you have the code
              or link, you can proceed directly to reset.
            </p>

            {/* Primary action — go to reset page */}
            <Link
              href={`/reset-password${
                enteredEmail
                  ? `?email=${encodeURIComponent(enteredEmail)}`
                  : ""
              }`}
              className="w-full h-10 flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium transition-opacity hover:opacity-90"
            >
              Enter reset code →
            </Link>

            {/* Secondary action — back to login */}
            <Link
              href="/login"
              className="w-full h-10 flex items-center justify-center rounded-md border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          /* Default state — email form */
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="forgot-email" className="text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`h-10 w-full px-3 rounded-md border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:ring-1 focus:ring-ring focus:border-ring ${
                  errors.email
                    ? "border-destructive focus:ring-destructive"
                    : "border-input"
                }`}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && (
                <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isSubmitting ? "Sending reset email…" : "Send reset link"}
            </button>

            <p className="text-sm text-muted-foreground text-center pt-1">
              Remembered your password?{" "}
              <Link
                href="/login"
                className="text-foreground font-medium underline underline-offset-4 hover:text-primary transition-colors"
              >
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
