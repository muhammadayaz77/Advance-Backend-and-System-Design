import type { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../lib/errors.js";

export function requireFreelancer(req: Request, _res: Response, next: NextFunction): void {
  const user = (req as any).user;
  if (!user || user.accountType !== "freelancer") {
    throw new ForbiddenError("Freelancer account required");
  }
  next();
}

