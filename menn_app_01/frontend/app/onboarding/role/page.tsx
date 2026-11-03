"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../hooks/use-auth";
import { authApi } from "../../../lib/api/auth";
import { ApiError } from "../../../lib/api-client";

export default function OnboardingRolePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, setTokenAndUser } = useAuth();

  const [accountType, setAccountType] = useState<"freelancer" | "client" | null>(null);
  const [role, setRole] = useState<"individual" | "agency" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  async function handleComplete() {
    if (!accountType || !role) {
      setError("Please select both your account type and role to proceed.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { accessToken } = await authApi.completeOnboarding({ accountType, role });
      setTokenAndUser(accessToken);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to complete onboarding. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="auth-page">
        <div className="auth-card" style={{ textAlign: "center", padding: 60 }}>
          <span className="spinner" style={{ margin: "0 auto" }} />
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">🚀</div>
          <span className="auth-logo-text">AuthFlow Setup</span>
        </div>

        <h1 className="auth-title">Welcome{user?.email ? `, ${user.email.split("@")[0]}` : ""}!</h1>
        <p className="auth-subtitle">Tell us how you plan to use the platform</p>

        {error && (
          <div className="alert alert-error" role="alert">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <label className="form-label" style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
            1. I want to:
          </label>
          <div className="onboard-grid">
            <div
              id="card-freelancer"
              className={`onboard-card${accountType === "freelancer" ? " selected" : ""}`}
              onClick={() => setAccountType("freelancer")}
              role="button"
              tabIndex={0}
            >
              <div className="onboard-card-icon">💼</div>
              <div className="onboard-card-title">Work & Earn</div>
              <div className="onboard-card-desc">Offer services and get hired by clients worldwide</div>
            </div>

            <div
              id="card-client"
              className={`onboard-card${accountType === "client" ? " selected" : ""}`}
              onClick={() => setAccountType("client")}
              role="button"
              tabIndex={0}
            >
              <div className="onboard-card-icon">🏢</div>
              <div className="onboard-card-title">Hire Talent</div>
              <div className="onboard-card-desc">Post projects and collaborate with professionals</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <label className="form-label" style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
            2. I am operating as:
          </label>
          <div className="onboard-grid">
            <div
              id="card-individual"
              className={`onboard-card${role === "individual" ? " selected" : ""}`}
              onClick={() => setRole("individual")}
              role="button"
              tabIndex={0}
            >
              <div className="onboard-card-icon">👤</div>
              <div className="onboard-card-title">Individual</div>
              <div className="onboard-card-desc">Solo professional or independent freelancer</div>
            </div>

            <div
              id="card-agency"
              className={`onboard-card${role === "agency" ? " selected" : ""}`}
              onClick={() => setRole("agency")}
              role="button"
              tabIndex={0}
            >
              <div className="onboard-card-icon">👥</div>
              <div className="onboard-card-title">Agency / Team</div>
              <div className="onboard-card-desc">A company or agency with multiple team members</div>
            </div>
          </div>
        </div>

        <button
          id="onboarding-submit-btn"
          type="button"
          onClick={handleComplete}
          className="btn btn-primary"
          disabled={isSubmitting || !accountType || !role}
          style={{ width: "100%", marginTop: 24 }}
        >
          {isSubmitting ? <span className="spinner" /> : null}
          {isSubmitting ? "Finalizing account…" : "Complete Setup →"}
        </button>
      </div>
    </main>
  );
}
