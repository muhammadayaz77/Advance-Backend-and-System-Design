export interface JwtPayload {
  sub: string;
  email: string;
  accountType: "freelancer" | "client" | null;
  role: "individual" | "agency" | null;
  onboardingCompleted: boolean;
  iat: number;
  exp: number;
}

/**
 * Decodes a JWT payload from its base64url-encoded middle segment.
 * Does NOT verify the signature — used only for reading claims client-side.
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    // Convert base64url to base64
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const payload = JSON.parse(json) as JwtPayload;

    // Reject expired tokens client-side
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
