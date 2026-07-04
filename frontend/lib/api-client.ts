/**
 * Central HTTP client for all backend requests.
 *
 * Responsibilities:
 *  - Attaches the in-memory Bearer access token to authenticated requests.
 *  - Automatically refreshes the access token (via httpOnly refresh-token cookie)
 *    when a 401 is received, then retries the original request once.
 *  - Unwraps the server's { success, data } envelope.
 *  - Throws a typed ApiError on every failure so callers never have to inspect raw
 *    HTTP status codes.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

/** Browser `fetch` rejects with `TypeError: Failed to fetch` when the server is down, DNS fails, or CORS blocks the response. */
const NETWORK_ERROR_STATUS = 503;

function throwUnreachableApi(): never {
  throw new ApiError(
    NETWORK_ERROR_STATUS,
    `Cannot reach the API (${API_BASE}). Start the Nest backend (default port 3001) or set NEXT_PUBLIC_API_URL in frontend/.env.local so it matches your server URL and includes /api/v1.`,
  );
}

async function fetchWithApiBase(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throwUnreachableApi();
  }
}

// ─── Typed error ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

// ─── Server response shapes ─────────────────────────────────────────────────────

type SuccessEnvelope<T> = { success: true; data: T };
type ErrorEnvelope = { success: false; statusCode: number; message: string };
type ApiEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

// ─── Token refresh (de-duplicated across parallel requests) ─────────────────────

let refreshPromise: Promise<string | null> | null = null;

async function doTokenRefresh(): Promise<string | null> {
  try {
    const res = await fetchWithApiBase(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include", // sends the httpOnly refresh_token cookie
    });

    if (!res.ok) {
      clearAccessToken();
      return null;
    }

    const body = (await res.json()) as ApiEnvelope<{ accessToken: string }>;
    if (!body.success) {
      clearAccessToken();
      return null;
    }

    setAccessToken(body.data.accessToken);
    return body.data.accessToken;
  } catch {
    clearAccessToken();
    return null;
  }
}

// ─── Core request function ──────────────────────────────────────────────────────

export interface RequestOptions {
  /** Skip attaching the Authorization header (public endpoints). */
  skipAuth?: boolean;
  /** Internal — prevents infinite retry loop after a refresh. */
  _isRetry?: boolean;
}

export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const token = options.skipAuth ? null : getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetchWithApiBase(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: "include", // always include for the refresh cookie
    body: body != null ? JSON.stringify(body) : undefined,
  });

  // ── Auto-refresh on 401 (once per original request) ────────────────────────
  if (response.status === 401 && !options.skipAuth && !options._isRetry) {
    // Deduplicate: many parallel calls all wait for the same refresh
    refreshPromise ??= doTokenRefresh().finally(() => {
      refreshPromise = null;
    });
    const newToken = await refreshPromise;

    if (newToken) {
      return apiRequest<T>(method, path, body, { ...options, _isRetry: true });
    }

    throw new ApiError(401, "Session expired. Please log in again.");
  }

  // ── 204 No Content ──────────────────────────────────────────────────────────
  if (response.status === 204) return undefined as T;

  const json = (await response.json()) as ApiEnvelope<T>;

  if (!json.success) {
    const msg =
      typeof (json as ErrorEnvelope).message === "string"
        ? (json as ErrorEnvelope).message
        : "An unexpected error occurred.";
    throw new ApiError(response.status, msg);
  }

  return (json as SuccessEnvelope<T>).data;
}

// ─── Multipart upload ──────────────────────────────────────────────────────────
// Separate from apiRequest because browser must set Content-Type with boundary.
// Follows the same 401-refresh + envelope-unwrap pattern as apiRequest.

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: RequestOptions = {},
): Promise<T> {
  const token = options.skipAuth ? null : getAccessToken();

  // No Content-Type header — browser injects multipart/form-data boundary automatically
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetchWithApiBase(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    credentials: "include",
    body: formData,
  });

  // Auto-refresh on 401 (once), then retry
  if (response.status === 401 && !options.skipAuth && !options._isRetry) {
    refreshPromise ??= doTokenRefresh().finally(() => {
      refreshPromise = null;
    });
    const newToken = await refreshPromise;
    if (newToken) {
      return apiUpload<T>(path, formData, { ...options, _isRetry: true });
    }
    throw new ApiError(401, "Session expired. Please log in again.");
  }

  if (response.status === 204) return undefined as T;

  const json = (await response.json()) as ApiEnvelope<T>;

  if (!json.success) {
    const msg =
      typeof (json as ErrorEnvelope).message === "string"
        ? (json as ErrorEnvelope).message
        : "An unexpected error occurred.";
    throw new ApiError(response.status, msg);
  }

  return (json as SuccessEnvelope<T>).data;
}
