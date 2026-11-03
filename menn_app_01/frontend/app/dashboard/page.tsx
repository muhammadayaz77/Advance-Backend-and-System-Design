"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../hooks/use-auth";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, deleteAccount } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    } else if (!isLoading && isAuthenticated && user && !user.onboardingCompleted) {
      router.replace("/onboarding/role");
    }
  }, [isLoading, isAuthenticated, user, router]);

  async function handleLogout() {
    setIsLoggingOut(true);
    setActionError(null);
    try {
      await logout();
      router.push("/login");
    } catch {
      setActionError("Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    setActionError(null);
    try {
      await deleteAccount();
      router.push("/signup");
    } catch {
      setActionError("Failed to delete account. Please try again.");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading || !isAuthenticated || !user) {
    return (
      <main className="dashboard-page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3, margin: "0 auto 16px" }} />
          <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>Loading session…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-container">
        {actionError && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: 20 }}>
            <span>⚠</span>
            <span>{actionError}</span>
          </div>
        )}

        {/* Header */}
        <header className="dashboard-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="auth-logo-icon">🔐</div>
            <div>
              <h1 className="dashboard-title">Dashboard</h1>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                Signed in as <strong style={{ color: "var(--color-text)" }}>{user.email}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              id="dashboard-logout-btn"
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="btn btn-outline"
              style={{ fontSize: 13 }}
            >
              {isLoggingOut ? <span className="spinner" /> : null}
              {isLoggingOut ? "Signing out…" : "Sign out"}
            </button>

            <button
              id="dashboard-delete-btn"
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-danger"
              style={{ fontSize: 13 }}
            >
              Delete account
            </button>
          </div>
        </header>

        {/* Delete Confirmation Modal / Banner */}
        {showDeleteConfirm && (
          <div
            className="alert alert-error"
            style={{
              padding: 20,
              flexDirection: "column",
              gap: 12,
              marginBottom: 24,
              borderRadius: "var(--radius-md)",
            }}
          >
            <div>
              <strong>⚠ Are you sure you want to permanently delete your account?</strong>
              <p style={{ fontSize: 13, marginTop: 4 }}>
                This action is irreversible. All your data, profile settings, and access will be purged immediately.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, alignSelf: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-outline"
                style={{ padding: "8px 16px", fontSize: 12 }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="btn btn-danger"
                style={{ padding: "8px 16px", fontSize: 12 }}
                disabled={isDeleting}
              >
                {isDeleting ? <span className="spinner" /> : null}
                {isDeleting ? "Deleting…" : "Yes, delete permanently"}
              </button>
            </div>
          </div>
        )}

        {/* Overview Grid */}
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="dashboard-card-title">User ID (Subject)</div>
            <div className="dashboard-card-value" style={{ fontSize: 14, fontFamily: "monospace", color: "var(--color-text-muted)" }}>
              {user.sub}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-title">Account Type</div>
            <div className="dashboard-card-value" style={{ textTransform: "capitalize" }}>
              {user.accountType ? (
                <span>💼 {user.accountType}</span>
              ) : (
                <span style={{ color: "var(--color-text-faint)" }}>Not selected</span>
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-title">Role Profile</div>
            <div className="dashboard-card-value" style={{ textTransform: "capitalize" }}>
              {user.role ? (
                <span>👤 {user.role}</span>
              ) : (
                <span style={{ color: "var(--color-text-faint)" }}>Not selected</span>
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-title">Onboarding Status</div>
            <div className="dashboard-card-value">
              {user.onboardingCompleted ? (
                <span className="dashboard-badge badge-success">✓ Completed</span>
              ) : (
                <span className="dashboard-badge badge-warning">⚠ Pending Setup</span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="dashboard-card" style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Session & Security Information</h2>
            <Link
              href="/onboarding/role"
              className="btn btn-outline"
              style={{ fontSize: 12, padding: "6px 14px", textDecoration: "none" }}
            >
              Update Role / Preferences
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", rowGap: 12, fontSize: 14 }}>
            <span style={{ color: "var(--color-text-muted)" }}>Email address:</span>
            <span style={{ color: "var(--color-text)", fontWeight: 500 }}>{user.email}</span>

            <span style={{ color: "var(--color-text-muted)" }}>Token Expiry:</span>
            <span style={{ color: "var(--color-text-muted)", fontFamily: "monospace", fontSize: 13 }}>
              {user.exp ? new Date(user.exp * 1000).toLocaleString() : "N/A"}
            </span>

            <span style={{ color: "var(--color-text-muted)" }}>Silent Refresh:</span>
            <span style={{ color: "var(--color-success)", fontSize: 13 }}>
              ● Enabled (httpOnly 7-day rolling cookie)
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
