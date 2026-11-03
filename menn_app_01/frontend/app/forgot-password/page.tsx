"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "../../lib/api/auth";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "../../lib/validations/auth";
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
        res.message || "If an account exists for this email, a password reset link has been sent."
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
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🔐</div>
          <span className="auth-logo-text">AuthFlow</span>
        </div>

        <h1 className="auth-title">Reset password</h1>
        <p className="auth-subtitle">
          Enter your account email to receive a password recovery link
        </p>

        {globalError && (
          <div className="alert alert-error" role="alert">
            <span>⚠</span>
            <span>{globalError}</span>
          </div>
        )}

        {successMessage ? (
          <div>
            <div className="alert alert-success" role="alert" style={{ marginBottom: 24 }}>
              <span>✓</span>
              <span>{successMessage}</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 24, lineHeight: 1.6 }}>
              Check your inbox for a password reset email. If you have the code or link, you can proceed directly to reset.
            </p>
            <Link
              href={`/reset-password${enteredEmail ? `?email=${encodeURIComponent(enteredEmail)}` : ""}`}
              className="btn btn-primary"
              style={{ display: "block", textAlign: "center", textDecoration: "none", marginBottom: 12 }}
            >
              Enter Reset Code →
            </Link>
            <div style={{ textAlign: "center" }}>
              <Link
                href="/login"
                className="btn btn-outline"
                style={{ display: "inline-block", width: "100%", textDecoration: "none", fontSize: 13 }}
              >
                Back to Sign in
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="form-group">
              <label htmlFor="forgot-email" className="form-label">
                Email address
              </label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`form-input${errors.email ? " error" : ""}`}
                {...register("email")}
              />
              {errors.email && (
                <span className="form-error">⚠ {errors.email.message}</span>
              )}
            </div>

            <button
              id="forgot-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ width: "100%", marginTop: 8 }}
            >
              {isSubmitting ? <span className="spinner" /> : null}
              {isSubmitting ? "Sending reset email…" : "Send Reset Link"}
            </button>

            <p className="auth-link">
              Remembered your password? <Link href="/login">Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
