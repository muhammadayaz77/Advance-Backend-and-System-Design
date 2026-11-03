import passport from "passport";
import * as authService from "./auth.service.js";
import { env } from "../../config/env.js";
// ─── Public Endpoints ─────────────────────────────────────────────────────────
export async function register(req, res) {
    await authService.register(req.body);
    res.status(201).json({
        success: true,
        data: { message: "Registration successful. Please check your email to verify your account." },
    });
}
export async function login(req, res) {
    const { accessToken } = await authService.login(req.body, res);
    res.status(200).json({
        success: true,
        data: { accessToken },
    });
}
export async function verifyEmail(req, res) {
    await authService.verifyEmail(req.body);
    res.status(200).json({
        success: true,
        data: { message: "Email verified successfully. You can now log in." },
    });
}
export async function resendVerification(req, res) {
    await authService.resendVerification(req.body);
    // Always generic — never leak whether email exists
    res.status(200).json({
        success: true,
        data: { message: "If an unverified account exists for this email, a new code has been sent." },
    });
}
export async function forgotPassword(req, res) {
    await authService.forgotPassword(req.body);
    // Always generic — never leak whether email exists
    res.status(200).json({
        success: true,
        data: { message: "If an account exists for this email, a password reset link has been sent." },
    });
}
export async function resetPassword(req, res) {
    await authService.resetPassword(req.body);
    res.status(200).json({
        success: true,
        data: { message: "Password reset successfully. You can now log in with your new password." },
    });
}
export async function refreshTokens(req, res) {
    const refreshToken = req.cookies?.["refresh_token"];
    const { accessToken } = await authService.refreshTokens(refreshToken, res);
    res.status(200).json({
        success: true,
        data: { accessToken },
    });
}
export async function logout(req, res) {
    authService.logout(res);
    res.status(200).json({
        success: true,
        data: { message: "Logged out successfully" },
    });
}
// ─── Protected Endpoints ──────────────────────────────────────────────────────
export async function completeOnboarding(req, res) {
    const { sub: userId } = req.user;
    const { accessToken } = await authService.completeOnboarding(userId, req.body, res);
    res.status(200).json({
        success: true,
        data: { accessToken },
    });
}
export async function deleteAccount(req, res) {
    const { sub: userId } = req.user;
    await authService.deleteAccount(userId, res);
    res.status(200).json({
        success: true,
        data: { message: "Account deleted successfully" },
    });
}
// ─── Google OAuth Endpoints ────────────────────────────────────────────────────
export function googleInitiate(req, res, next) {
    passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false,
    })(req, res, next);
}
export function googleCallback(req, res, next) {
    passport.authenticate("google", { session: false, failureRedirect: `${env.CLIENT_URL}/login?error=oauth_failed` }, async (err, profile) => {
        if (err || !profile) {
            return res.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`);
        }
        try {
            const { accessToken } = await authService.googleLogin(profile.googleId, profile.email, profile.fullName, profile.avatarUrl, res);
            // Fragment is never forwarded to servers — safe for token transport
            res.redirect(`${env.CLIENT_URL}/auth/callback#token=${accessToken}`);
        }
        catch {
            res.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`);
        }
    })(req, res, next);
}
//# sourceMappingURL=auth.controller.js.map