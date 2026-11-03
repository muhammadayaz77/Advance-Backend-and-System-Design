import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { JwtPayload, AuthenticatedRequest } from "../types/auth.types.js";

/**
 * Global JWT auth middleware.
 * Reads the Authorization: Bearer <token> header.
 * Attaches the decoded payload to req.user.
 *
 * Routes can opt out by setting res.locals.skipAuth = true
 * before this middleware runs (done in the router via the `publicRoute` helper).
 */
export function jwtAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Allow routes that have been marked as public
  if (res.locals["skipAuth"] === true) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      statusCode: 401,
      message: "Authentication required",
    });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch {
    res.status(401).json({
      success: false,
      statusCode: 401,
      message: "Invalid or expired access token",
    });
  }
}

/**
 * Middleware that marks the current route as public (opt-out from JWT guard).
 * Place it BEFORE the route handler.
 */
export function publicRoute(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  res.locals["skipAuth"] = true;
  next();
}
