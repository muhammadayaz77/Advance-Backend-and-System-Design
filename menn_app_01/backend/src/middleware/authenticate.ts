import passport from "passport";
import type { Request, Response, NextFunction } from "express";

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }

  passport.authenticate(
    "jwt",
    { session: false },
    (_err: unknown, user: Express.User | false | null) => {
      if (user) {
        req.user = user;
      }
      next();
    }
  )(req, res, next);
}

