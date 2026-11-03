"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { setAccessToken, clearAccessToken, ApiError } from "../lib/api-client";
import { authApi } from "../lib/api/auth";
import { decodeJwt, type JwtPayload } from "../lib/jwt";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: JwtPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setTokenAndUser: (token: string) => void;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

// ── Context ────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  /** Decodes the token, stores it in memory, and updates user state. */
  const setTokenAndUser = useCallback((token: string) => {
    const payload = decodeJwt(token);
    if (!payload) return;
    setAccessToken(token);
    setUser(payload);
  }, []);

  /** Logout: clear server-side cookie + clear client-side state. */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Best-effort — always clear local state
    }
    clearAccessToken();
    setUser(null);
  }, []);

  /** Delete account: removes user from DB + clears local state. */
  const deleteAccount = useCallback(async () => {
    try {
      await authApi.deleteAccount();
    } catch {
      // Best-effort
    }
    clearAccessToken();
    setUser(null);
  }, []);

  /** On mount, restore session from httpOnly refresh cookie. */
  useEffect(() => {
    mountedRef.current = true;

    async function restoreSession() {
      try {
        const { accessToken } = await authApi.refresh();
        if (mountedRef.current) {
          setTokenAndUser(accessToken);
        }
      } catch (err) {
        // 401 is expected when user is not logged in — not an error
        if (!(err instanceof ApiError && err.statusCode === 401)) {
          console.warn("Session restore failed:", err);
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      mountedRef.current = false;
    };
  }, [setTokenAndUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        setTokenAndUser,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
