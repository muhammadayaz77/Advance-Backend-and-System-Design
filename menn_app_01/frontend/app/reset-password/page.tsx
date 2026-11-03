"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "../../lib/api/auth";
import { resetPasswordSchema, type ResetPasswordFormData } from "../../lib/validations/auth";
import { ApiError } from "../../lib/api-client";

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
        setGlobalError("Failed to reset password. The code may be invalid or expired.");
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

        <h1 className="auth-title">Create new password</h1>
        <p className="auth-subtitle">Choose a strong password with at least 8 characters</p>

        {globalError && (
          <div className="alert alert-error" role="alert">
            <span>⚠</span>
            <span>{globalError}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="alert">
            <span>✓</span>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label htmlFor="reset-email" className="form-label">Email address</label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reset-token" className="form-label">Reset Code / Token</label>
            <input
              id="reset-token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter 6-character code"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="new-password" className="form-label">New password</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={`form-input${errors.newPassword ? " error" : ""}`}
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <span className="form-error">⚠ {errors.newPassword.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password" className="form-label">Confirm new password</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={`form-input${errors.confirmPassword ? " error" : ""}`}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <span className="form-error">⚠ {errors.confirmPassword.message}</span>
            )}
          </div>

          <button
            id="reset-submit-btn"
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ width: "100%", marginTop: 8 }}
          >
            {isSubmitting ? <span className="spinner" /> : null}
            {isSubmitting ? "Updating password…" : "Reset Password"}
          </button>

          <p className="auth-link">
            Never mind? <Link href="/login">Return to Sign in</Link>
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
        <main className="auth-page">
          <div className="auth-card" style={{ textAlign: "center", padding: 60 }}>
            <span className="spinner" style={{ margin: "0 auto" }} />
          </div>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
