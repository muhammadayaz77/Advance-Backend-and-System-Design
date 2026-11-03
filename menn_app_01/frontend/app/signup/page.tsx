"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "../../lib/api/auth";
import { registerSchema, type RegisterFormData } from "../../lib/validations/auth";
import { ApiError } from "../../lib/api-client";

export default function SignupPage() {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    setGlobalError(null);
    try {
      await authApi.register(data);
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setGlobalError(err.message);
      } else {
        setGlobalError("An unexpected error occurred. Please try again.");
      }
    }
  }

  function handleGoogleSignup() {
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

        <h1 className="auth-title">Create an account</h1>
        <p className="auth-subtitle">Join us today — free forever</p>

        {globalError && (
          <div className="alert alert-error" role="alert">
            <span>⚠</span>
            <span>{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label htmlFor="signup-name" className="form-label">Full name</label>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              className={`form-input${errors.fullName ? " error" : ""}`}
              {...register("fullName")}
            />
            {errors.fullName && (
              <span className="form-error">⚠ {errors.fullName.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="signup-email" className="form-label">Email</label>
            <input
              id="signup-email"
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
            <label htmlFor="signup-password" className="form-label">Password</label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              className={`form-input${errors.password ? " error" : ""}`}
              {...register("password")}
            />
            {errors.password && (
              <span className="form-error">⚠ {errors.password.message}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Phone (optional)</label>
            <div className="phone-row">
              <input
                id="signup-country-code"
                type="text"
                placeholder="+1"
                className="form-input"
                {...register("countryCode")}
              />
              <input
                id="signup-phone"
                type="tel"
                autoComplete="tel"
                placeholder="555 000 0000"
                className="form-input"
                {...register("phone")}
              />
            </div>
          </div>

          <button
            id="signup-submit"
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: "8px" }}
            disabled={isSubmitting}
          >
            {isSubmitting ? <span className="spinner" /> : null}
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <button
          id="signup-google"
          type="button"
          className="btn btn-google"
          onClick={handleGoogleSignup}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="auth-link">
          Already have an account?{" "}
          <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
