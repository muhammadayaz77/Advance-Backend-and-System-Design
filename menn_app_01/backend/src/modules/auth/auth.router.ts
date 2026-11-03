import { Router } from "express";
import { jwtAuthMiddleware } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as authController from "./auth.controller.js";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  onboardingSchema,
} from "./auth.schemas.js";

const router = Router();

// ─── Public Routes ────────────────────────────────────────────────────────────

router.post(
  "/register",
  validate(registerSchema),
  authController.register
);

router.post(
  "/login",
  validate(loginSchema),
  authController.login
);

router.post(
  "/verify-email",
  validate(verifyEmailSchema),
  authController.verifyEmail
);

router.post(
  "/resend-verification",
  validate(resendVerificationSchema),
  authController.resendVerification
);

router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword
);

router.post(
  "/refresh",
  authController.refreshTokens
);

router.get(
  "/google",
  authController.googleInitiate
);

router.get(
  "/google/callback",
  authController.googleCallback
);

// ─── Protected Routes (require valid Bearer token) ────────────────────────────

router.post("/logout", authController.logout);

router.patch(
  "/onboarding",
  jwtAuthMiddleware,
  validate(onboardingSchema),
  authController.completeOnboarding
);

router.delete("/account", jwtAuthMiddleware, authController.deleteAccount);

export default router;
