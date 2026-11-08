import { Router, type Request, type Response, type NextFunction } from "express";
import passport from "passport";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireRefreshToken } from "../middleware/require-refresh-token.js";
import { env } from "../config/env.js";
import * as authService from "./auth.service.js";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  onboardingSchema,
} from "./auth.schemas.js";
import type { GoogleProfile } from "./strategies/google.strategy.js";

const router = Router();

// ─── Public Endpoints ─────────────────────────────────────────────────────────

router.post(
  "/register",
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await authService.register(req.body);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await authService.login(req.body, res);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/verify-email",
  validate(verifyEmailSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await authService.verifyEmail(req.body);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/resend-verification",
  validate(resendVerificationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await authService.resendVerification(req.body);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await authService.forgotPassword(req.body);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await authService.resetPassword(req.body);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/refresh",
  requireRefreshToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as { sub: string };
      const data = await authService.refreshTokens(user, res);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }
);

// ─── Google OAuth ─────────────────────────────────────────────────────────────

router.get("/google", (req: Request, res: Response, next: NextFunction) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      success: false,
      statusCode: 503,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      message: "Google OAuth is not configured on this server",
    });
  }

  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })(req, res, next);
});

router.get(
  "/google/callback",
  (req: Request, res: Response, next: NextFunction) => {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      console.warn("⚠️ Google OAuth credentials missing in environment variables");
      return res.redirect(`${env.CLIENT_URL}/login?error=oauth_not_configured`);
    }

    if (req.query.error) {
      console.error("❌ Google returned error in callback:", req.query.error, req.query.error_description);
      return res.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`);
    }

    passport.authenticate(
      "google",
      {
        session: false,
        failureRedirect: `${env.CLIENT_URL}/login?error=oauth_failed`,
      },
      async (err: unknown, profile: GoogleProfile | false | null, info: unknown) => {
        if (err || !profile) {
          console.error("❌ Google OAuth authentication error:", err, "Info:", info);
          return res.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`);
        }

        try {
          const { accessToken } = await authService.googleLogin(profile, res);
          // Redirect using URL fragment (#token=...), NEVER query param
          res.redirect(`${env.CLIENT_URL}/auth/callback#token=${accessToken}`);
        } catch (error) {
          console.error("❌ Google login database/token error:", error);
          res.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`);
        }
      }
    )(req, res, next);
  }
);

// ─── Protected Routes (JWT required) ─────────────────────────────────────────

router.patch(
  "/onboarding",
  requireAuth,
  validate(onboardingSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as { id: string };
      const data = await authService.completeOnboarding(user.id, req.body, res);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/logout",
  requireAuth,
  (_req: Request, res: Response) => {
    const data = authService.logout(res);
    res.status(200).json(data);
  }
);

router.delete(
  "/account",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as { id: string };
      const data = await authService.deleteAccount(user.id, res);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }
);

export default router;

