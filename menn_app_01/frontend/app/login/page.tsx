"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "../../lib/api/auth";
import { useAuth } from "../../hooks/use-auth";
import { loginSchema, type LoginFormData } from "../../lib/validations/auth";
import { ApiError } from "../../lib/api-client";
import { decodeJwt } from "../../lib/jwt";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokenAndUser } = useAuth();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const oauthError = searchParams.get("error");
  const isVerified = searchParams.get("verified") === "true";
  const isReset = searchParams.get("reset") === "success";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setGlobalError(null);
    try {
      const { accessToken } = await authApi.login(data);
      setTokenAndUser(accessToken);

      const payload = decodeJwt(accessToken);
      const redirect = searchParams.get("redirect") ?? "/dashboard";

      if (payload && !payload.onboardingCompleted) {
        router.push("/onboarding/role");
      } else {
        router.push(redirect);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setGlobalError(err.message);
      } else {
        setGlobalError("An unexpected error occurred. Please try again.");
      }
    }
  }

  function handleGoogleLogin() {
    setIsGoogleLoading(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
    window.location.href = `${apiBase}/auth/google`;
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🔐</div>
          <span className="auth-logo-text">AuthFlow</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        {isVerified && (
          <div className="alert alert-success" role="alert">
            <span>✓</span>
            <span>Email verified successfully! Please sign in to continue.</span>
          </div>
        )}

        {isReset && (
          <div className="alert alert-success" role="alert">
            <span>✓</span>
            <span>Password reset successfully! Please sign in with your new password.</span>
          </div>
        )}

        {oauthError === "oauth_failed" && (
          <div className="alert alert-error" role="alert">
            <span>⚠</span>
            <span>Google authentication failed. Please try again or sign in with your email.</span>
          </div>
        )}

        {globalError && (
          <div className="alert alert-error" role="alert">
            <span>⚠</span>
            <span>{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Email</label>
            <input
              id="login-email"
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

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className={`form-input${errors.password ? " error" : ""}`}
              {...register("password")}
            />
            {errors.password && (
              <span className="form-error">⚠ {errors.password.message}</span>
            )}
          </div>

          <div style={{ textAlign: "right", marginBottom: "20px" }}>
            <Link href="/forgot-password" style={{ fontSize: "13px", color: "var(--color-primary-light)", textDecoration: "none" }}>
              Forgot password?
            </Link>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? <span className="spinner" /> : null}
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <button
          id="login-google"
          type="button"
          className="btn btn-google"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? <span className="spinner" /> : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
          )}
          {isGoogleLoading ? "Redirecting…" : "Continue with Google"}
        </button>

        <p className="auth-link">
          Don&apos;t have an account?{" "}
          <Link href="/signup">Create one</Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
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
      <LoginForm />
    </Suspense>
  );
}
