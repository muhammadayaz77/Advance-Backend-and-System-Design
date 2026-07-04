"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

/**
 * OAuth callback page.
 *
 * After a successful Google OAuth flow the backend redirects here with the
 * access token in the URL fragment:
 *   /auth/callback#token=<JWT>
 *
 * This page extracts the token, stores it in the auth context, and redirects
 * the user to the appropriate dashboard or onboarding page.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { setTokenAndUser } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    // Prevent double-processing in React strict mode
    if (processed.current) return;
    processed.current = true;

    const hash = window.location.hash; // e.g. "#token=eyJ…"
    const token = new URLSearchParams(hash.substring(1)).get("token");

    if (!token) {
      // No token in URL — send back to login
      router.replace("/login");
      return;
    }

    // Store the token in the auth context & in-memory api-client
    setTokenAndUser(token);

    // Decode the JWT payload to decide where to redirect
    try {
      const payload = JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      );

      if (!payload.onboardingCompleted) {
        router.replace("/onboarding/role");
      } else {
        router.replace("/dashboard");
      }
    } catch {
      // Malformed token — fall back to login
      router.replace("/login");
    }
  }, [router, setTokenAndUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[#6CAF4F] border-t-transparent" />
        <p className="text-gray-600 text-sm font-medium">
          Completing sign-in…
        </p>
      </div>
    </div>
  );
}
