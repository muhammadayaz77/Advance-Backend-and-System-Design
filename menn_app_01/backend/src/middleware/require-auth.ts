import type { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../lib/errors.js";

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    throw new UnauthorizedError("Authentication required");
  }
  next();
}
