import type { Request } from "express";
import type { AccountType, UserRole } from "../generated/prisma/client.js";

export interface JwtPayload {
  sub: string;
  email: string;
  accountType: AccountType | null;
  role: UserRole | null;
  onboardingCompleted: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
