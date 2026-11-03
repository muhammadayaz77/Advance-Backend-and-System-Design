import { NextRequest, NextResponse } from "next/server";

/**
 * Edge middleware for lightweight route protection.
 *
 * We can only check for the PRESENCE of the refresh_token cookie here —
 * the Edge runtime cannot run Node.js crypto to verify JWT signatures.
 * The actual token validation happens on the API server.
 *
 * If the cookie is absent → redirect to /login.
 * If the cookie is present → allow through (the API will 401 if it's invalid).
 */
export function middleware(request: NextRequest) {
  const hasRefreshToken = request.cookies.has("refresh_token");

  if (!hasRefreshToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};
