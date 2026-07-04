"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user, logout, deleteAccount } = useAuth();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await logout();
    router.replace("/login");
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "This will permanently delete your account and all data. Are you sure?"
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.success("Your account has been deleted.");
      router.replace("/login");
    } catch {
      toast.error("Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-700">
            {user?.fullName?.[0]?.toUpperCase() ?? "U"}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back!</p>
        </div>

        {/* User details */}
        <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
          <Row label="Name" value={user?.fullName ?? "—"} />
          <Row label="Email" value={user?.email ?? "—"} />
          <Row
            label="Account Type"
            value={
              user?.accountType
                ? user.accountType.charAt(0).toUpperCase() +
                  user.accountType.slice(1)
                : "—"
            }
          />
          <Row
            label="Role"
            value={
              user?.role
                ? user.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                : "—"
            }
          />
          <Row
            label="Onboarding"
            value={user?.onboardingCompleted ? "✅ Complete" : "⏳ Pending"}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          <button
            id="logout-btn"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm disabled:opacity-60 transition-colors"
          >
            {isLoggingOut ? "Logging out…" : "Log Out"}
          </button>
          <button
            id="delete-account-btn"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full h-11 rounded-xl bg-white border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-sm disabled:opacity-60 transition-colors"
          >
            {isDeleting ? "Deleting…" : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className="text-sm text-gray-900 font-semibold">{value}</span>
    </div>
  );
}
