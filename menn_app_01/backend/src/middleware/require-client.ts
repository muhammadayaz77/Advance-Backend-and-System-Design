import type { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../lib/errors.js";

export function requireClient(req: Request, _res: Response, next: NextFunction): void {
  const user = (req as any).user;
  if (!user || user.accountType !== "client") {
    throw new ForbiddenError("Client account required");
  }
  next();
}
