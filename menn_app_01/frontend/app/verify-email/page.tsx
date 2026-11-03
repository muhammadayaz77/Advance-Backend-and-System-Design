"use client";

import { useState, useRef, useEffect, Suspense, useTransition } from "react";
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

    // Auto-advance
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all filled
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
    const pasted = e.clipboardData.getData("text").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
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
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🔐</div>
          <span className="auth-logo-text">AuthFlow</span>
        </div>

        <h1 className="auth-title">Verify your email</h1>
        <p className="auth-subtitle">
          Enter the 6-character code sent to{" "}
          <strong style={{ color: "var(--color-text)" }}>{email || "your email"}</strong>
        </p>

        {error && (
          <div className="alert alert-error" role="alert">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="alert">
            <span>✓</span>
            <span>{success}</span>
          </div>
        )}

        {!initialEmail && (
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label htmlFor="verify-email-input" className="form-label">
              Email Address
            </label>
            <input
              id="verify-email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="form-input"
            />
          </div>
        )}

        <div className="otp-grid">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              id={`otp-cell-${idx}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              className={`otp-cell${digit ? " filled" : ""}`}
              aria-label={`Digit ${idx + 1}`}
              autoFocus={idx === 0}
            />
          ))}
        </div>

        <button
          id="verify-submit-btn"
          type="button"
          onClick={() => submitCode()}
          className="btn btn-primary"
          disabled={isSubmitting || digits.some((d) => !d)}
          style={{ width: "100%", marginTop: 8 }}
        >
          {isSubmitting ? <span className="spinner" /> : null}
          {isSubmitting ? "Verifying…" : "Verify code"}
        </button>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button
            id="resend-code-btn"
            type="button"
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
            className="btn btn-outline"
            style={{ width: "100%", fontSize: 13 }}
          >
            {isResending ? <span className="spinner" /> : null}
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : "Resend verification code"}
          </button>
        </div>

        <p className="auth-link">
          Wrong email address? <Link href="/signup">Sign up again</Link> or{" "}
          <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
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
      <VerifyEmailContent />
    </Suspense>
  );
}
