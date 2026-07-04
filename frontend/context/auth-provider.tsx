"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearAccessToken,
  setAccessToken,
} from "@/lib/api-client";
import { authApi } from "@/lib/api/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  accountType?: string;
  role?: string;
  onboardingCompleted?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setTokenAndUser: (token: string) => void;
  logout: () => Promise<void>;
  /** Calls DELETE /auth/account, then clears local session. */
  deleteAccount: () => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    // JWT payload is the second segment (base64url encoded)
    return JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
  } catch {
    return null;
  }
}

function tokenToUser(token: string): AuthUser | null {
  const payload = decodeJwt(token);
  if (!payload) return null;

  // Reject expired tokens immediately on the client
  const exp = payload.exp as number | undefined;
  if (exp && Date.now() / 1000 > exp) return null;

  return {
    id: String(payload.sub ?? ""),
    email: String(payload.email ?? ""),
    fullName: payload.fullName as string | undefined,
    accountType: payload.accountType as string | undefined,
    role: payload.role as string | undefined,
    onboardingCompleted: payload.onboardingCompleted as boolean | undefined,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Bootstrap auth from the httpOnly refresh_token cookie (client-only).
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const { accessToken } = await authApi.refresh();
        if (cancelled) return;
        const decoded = tokenToUser(accessToken);
        if (decoded) {
          setAccessToken(accessToken);
          setUser(decoded);
        } else {
          clearAccessToken();
          setUser(null);
        }
      } catch {
        if (!cancelled) {
          clearAccessToken();
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const setTokenAndUser = useCallback((token: string) => {
    const decoded = tokenToUser(token);
    if (decoded) {
      setAccessToken(token);
      setUser(decoded);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if server logout fails, we still clear local auth state.
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    await authApi.deleteAccount();
    clearAccessToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      setTokenAndUser,
      logout,
      deleteAccount,
    }),
    [user, isLoading, setTokenAndUser, logout, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
