import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
/**
 * Global JWT auth middleware.
 * Reads the Authorization: Bearer <token> header.
 * Attaches the decoded payload to req.user.
 *
 * Routes can opt out by setting res.locals.skipAuth = true
 * before this middleware runs (done in the router via the `publicRoute` helper).
 */
export function jwtAuthMiddleware(req, res, next) {
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
        const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
        req.user = payload;
        next();
    }
    catch {
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
export function publicRoute(_req, res, next) {
    res.locals["skipAuth"] = true;
    next();
}
//# sourceMappingURL=auth.middleware.js.map