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
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
    window.location.href = `${apiBase}/auth/google`;
  }

  return (
    /* Full-screen centered layout — responsive padding on mobile */
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-10 sm:px-6">
      {/* Card: full width on mobile, capped at 420px on larger screens */}
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
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Sign in to your account to continue
        </p>

        {/* Success Alerts */}
        {isVerified && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-md bg-success/10 border border-success/25 text-success text-sm">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Email verified successfully! Please sign in to continue.</span>
          </div>
        )}

        {isReset && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-md bg-success/10 border border-success/25 text-success text-sm">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Password reset successfully! Please sign in with your new password.</span>
          </div>
        )}

        {/* Error Alerts */}
        {oauthError === "oauth_failed" && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-md bg-destructive/10 border border-destructive/25 text-destructive text-sm">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Google sign-in failed. Please try again or use email.</span>
          </div>
        )}

        {globalError && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-md bg-destructive/10 border border-destructive/25 text-destructive text-sm">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{globalError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={`h-10 w-full px-3 rounded-md border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:ring-1 focus:ring-ring focus:border-ring ${
                errors.email ? "border-destructive focus:ring-destructive" : "border-input"
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

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className={`h-10 w-full px-3 rounded-md border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:ring-1 focus:ring-ring focus:border-ring ${
                errors.password ? "border-destructive focus:ring-destructive" : "border-input"
              }`}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
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
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="w-full h-10 flex items-center justify-center gap-2 rounded-md border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGoogleLoading ? (
            <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
            </svg>
          )}
          {isGoogleLoading ? "Connecting…" : "Continue with Google"}
        </button>

        {/* Footer Link */}
        <p className="text-sm text-muted-foreground text-center mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-foreground font-medium underline underline-offset-4 hover:text-primary transition-colors">
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
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
      <LoginForm />
    </Suspense>
  );
}
