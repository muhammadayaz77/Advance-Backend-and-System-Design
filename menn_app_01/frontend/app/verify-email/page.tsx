"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "../../lib/api/auth";
import { ApiError } from "../../lib/api-client";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleDigitChange = (index: number, value: string) => {
    const char = value.slice(-1).toUpperCase();
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setError(null);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (char && index === 5 && newDigits.every((d) => d.length === 1)) {
      void submitCode(newDigits.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] ?? "";
    }
    setDigits(newDigits);
    setError(null);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (pasted.length >= 6) {
      void submitCode(newDigits.slice(0, 6).join(""));
    }
  };

  async function submitCode(codeToSubmit?: string) {
    const fullCode = codeToSubmit ?? digits.join("");
    if (!email) {
      setError("Please provide an email address.");
      return;
    }
    if (fullCode.length < 6) {
      setError("Please enter the complete 6-character code.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await authApi.verifyEmail({ email: email.trim(), code: fullCode });
      setSuccess("Email verified successfully! Redirecting to sign in…");
      setTimeout(() => {
        router.push("/login?verified=true");
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Verification failed. Please check the code and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setError("Please provide an email address to resend the code.");
      return;
    }
    if (resendCooldown > 0) return;

    setIsResending(true);
    setError(null);

    try {
      await authApi.resendVerification({ email: email.trim() });
      setResendCooldown(60);
      setSuccess("A new verification code has been sent to your email.");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to resend code. Please try again later.");
      }
    } finally {
      setIsResending(false);
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
          Verify your email
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Enter the 6-character code sent to{" "}
          <strong className="text-foreground font-medium">
            {email || "your email"}
          </strong>
        </p>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-md bg-destructive/10 border border-destructive/25 text-destructive text-sm">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
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

        {/* Optional email input if not passed via query param */}
        {!initialEmail && (
          <div className="flex flex-col gap-1.5 mb-4">
            <label htmlFor="verify-email-input" className="text-sm font-medium text-foreground">
              Email address
            </label>
            <input
              id="verify-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:ring-1 focus:ring-ring focus:border-ring"
            />
          </div>
        )}

        {/* OTP Grid — 6 boxes, responsive equal columns */}
        <div className="grid grid-cols-6 gap-2 my-6">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              id={`otp-cell-${idx}`}
              type="text"
              inputMode="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              autoFocus={idx === 0}
              aria-label={`Digit ${idx + 1}`}
              className={`aspect-square w-full rounded-md border text-center text-lg font-semibold text-foreground bg-background outline-none transition-colors focus:ring-1 focus:ring-ring focus:border-ring caret-primary font-mono
                ${digit
                  ? "border-primary text-primary"
                  : "border-input"
                }`}
            />
          ))}
        </div>

        {/* Verify Button */}
        <button
          type="button"
          onClick={() => submitCode()}
          disabled={isSubmitting || digits.some((d) => !d)}
          className="w-full h-10 flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting && (
            <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {isSubmitting ? "Verifying…" : "Verify code"}
        </button>

        {/* Resend Button */}
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || resendCooldown > 0}
          className="w-full h-10 flex items-center justify-center gap-2 mt-3 rounded-md border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResending && (
            <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {resendCooldown > 0
            ? `Resend code in ${resendCooldown}s`
            : "Resend verification code"}
        </button>

        {/* Footer Links */}
        <p className="text-sm text-muted-foreground text-center mt-6">
          Wrong email?{" "}
          <Link
            href="/signup"
            className="text-foreground font-medium underline underline-offset-4 hover:text-primary transition-colors"
          >
            Sign up again
          </Link>
          {" "}or{" "}
          <Link
            href="/login"
            className="text-foreground font-medium underline underline-offset-4 hover:text-primary transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
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
      <VerifyEmailContent />
    </Suspense>
  );
}
