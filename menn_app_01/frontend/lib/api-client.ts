// ── In-memory access token storage ───────────────────────────────────────────
// Never stored in localStorage / sessionStorage — XSS-safe.
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken(): void {
  accessToken = null;
}

// ── API base URL ──────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

// ── Error class ────────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errors?: { field: string; message: string }[]
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Refresh de-duplication ─────────────────────────────────────────────────────
// Single refresh promise shared across concurrent 401 requests.
let refreshPromise: Promise<string | null> | null = null;

async function doTokenRefresh(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) return null;

    const json = (await response.json()) as {
      success: boolean;
      data: { accessToken: string };
    };

    if (json.success && json.data?.accessToken) {
      setAccessToken(json.data.accessToken);
      return json.data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Core request function ──────────────────────────────────────────────────────
export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: { isRetry?: boolean }
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // ── 401 handling with de-duplicated refresh ─────────────────────────────────
  if (response.status === 401 && !options?.isRetry) {
    // De-duplicate: if a refresh is already in flight, wait for it
    refreshPromise ??= doTokenRefresh().finally(() => {
      refreshPromise = null;
    });

    const newToken = await refreshPromise;

    if (newToken) {
      // Retry the original request once with the new token
      return apiRequest<T>(method, path, body, { isRetry: true });
    }

    // Refresh failed — clear token and let the UI handle redirect
    clearAccessToken();
    throw new ApiError(401, "Session expired. Please log in again.");
  }

  // ── Parse response ──────────────────────────────────────────────────────────
  let json: { success: boolean; data?: T; message?: string; errors?: { field: string; message: string }[] };
  try {
    json = await response.json();
  } catch {
    throw new ApiError(response.status, "Invalid response from server");
  }

  if (!json.success) {
    throw new ApiError(
      response.status,
      json.message ?? "An error occurred",
      json.errors
    );
  }

  return json.data as T;
}

// ── Shorthand helpers ──────────────────────────────────────────────────────────
export const api = {
  get: <T>(path: string) => apiRequest<T>("GET", path),
  post: <T>(path: string, body?: unknown) => apiRequest<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>("PATCH", path, body),
  delete: <T>(path: string) => apiRequest<T>("DELETE", path),
};
