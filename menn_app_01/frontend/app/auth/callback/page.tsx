"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../hooks/use-auth";
import { decodeJwt } from "../../../lib/jwt";

function AuthCallbackContent() {
  const router = useRouter();
  const { setTokenAndUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.startsWith("#") ? hash.substring(1) : hash);
      const token = params.get("token");

      if (!token) {
        setError("No authentication token was received from the server.");
        return;
      }

      const payload = decodeJwt(token);
      if (!payload) {
        setError("Received an invalid or expired authentication token.");
        return;
      }

      setTokenAndUser(token);

      if (!payload.onboardingCompleted) {
        router.replace("/onboarding/role");
      } else {
        router.replace("/dashboard");
      }
    } catch {
      setError("An unexpected error occurred during Google sign-in.");
    }
  }, [router, setTokenAndUser]);

  return (
    <main className="auth-page">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="auth-logo" style={{ justifyContent: "center" }}>
          <div className="auth-logo-icon">🔐</div>
          <span className="auth-logo-text">AuthFlow</span>
        </div>

        {error ? (
          <>
            <h1 className="auth-title">Authentication Failed</h1>
            <div className="alert alert-error" role="alert" style={{ marginTop: 16 }}>
              <span>⚠</span>
              <span>{error}</span>
            </div>
            <Link
              href="/login"
              className="btn btn-primary"
              style={{ display: "inline-block", marginTop: 16, textDecoration: "none" }}
            >
              Return to Sign In
            </Link>
          </>
        ) : (
          <>
            <h1 className="auth-title">Authenticating…</h1>
            <p className="auth-subtitle">Finalizing your secure session</p>
            <div style={{ display: "flex", justifyContent: "center", margin: "32px 0" }}>
              <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
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
      <AuthCallbackContent />
    </Suspense>
  );
}
