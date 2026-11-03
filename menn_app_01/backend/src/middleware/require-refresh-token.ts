import passport from "passport";
import type { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../lib/errors.js";

export function requireRefreshToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  passport.authenticate(
    "jwt-refresh",
    { session: false },
    (err: unknown, payload: Express.User | false | null) => {
      if (err || !payload) {
        return next(new UnauthorizedError("Invalid or expired refresh token"));
      }
      req.user = payload;
      next();
    }
  )(req, res, next);
}
