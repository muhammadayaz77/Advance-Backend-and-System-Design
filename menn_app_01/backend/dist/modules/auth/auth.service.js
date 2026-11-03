import crypto from "crypto";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { sendVerificationEmail, sendPasswordResetEmail, } from "../../mail/mail.service.js";
// ─── Constants ────────────────────────────────────────────────────────────────
const DUMMY_HASH = await argon2.hash("dummy-timing-protection-password");
const OTP_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const COOKIE_BASE = {
    httpOnly: true,
    path: "/",
};
// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Generates a 6-character cryptographically secure OTP from an unambiguous alphabet. */
function generateOtp() {
    const bytes = crypto.randomBytes(6);
    return Array.from(bytes)
        .map((b) => OTP_ALPHABET[b % OTP_ALPHABET.length])
        .join("");
}
/** Signs both tokens in parallel and returns them. */
async function signTokenPair(payload) {
    const [accessToken, refreshToken] = await Promise.all([
        new Promise((resolve, reject) => jwt.sign(payload, env.JWT_ACCESS_SECRET, {
            expiresIn: env.JWT_ACCESS_EXPIRES_IN,
        }, (err, token) => err || !token ? reject(err) : resolve(token))),
        new Promise((resolve, reject) => jwt.sign(payload, env.JWT_REFRESH_SECRET, {
            expiresIn: env.JWT_REFRESH_EXPIRES_IN,
        }, (err, token) => err || !token ? reject(err) : resolve(token))),
    ]);
    return { accessToken, refreshToken };
}
/** Sets the httpOnly refresh token cookie on the response. */
function setRefreshCookie(res, token) {
    const isProduction = env.NODE_ENV === "production";
    res.cookie("refresh_token", token, {
        ...COOKIE_BASE,
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
}
/** Issues a new token pair, sets the refresh cookie, and returns the access token. */
async function issueTokens(res, userId, email, accountType, role, onboardingCompleted) {
    const payload = {
        sub: userId,
        email,
        accountType,
        role,
        onboardingCompleted,
    };
    const { accessToken, refreshToken } = await signTokenPair(payload);
    setRefreshCookie(res, refreshToken);
    return accessToken;
}
// ─── Service Functions ────────────────────────────────────────────────────────
export async function register(input) {
    const { fullName, email, password, phone, countryCode } = input;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        const error = new Error("An account with this email already exists");
        error.statusCode = 409;
        throw error;
    }
    const passwordHash = await argon2.hash(password);
    const otp = generateOtp();
    await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                fullName,
                email,
                passwordHash,
                phone,
                countryCode,
                authProvider: "email",
                profile: { create: {} },
            },
        });
        await tx.emailVerification.create({
            data: {
                userId: user.id,
                code: otp,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
            },
        });
    });
    // Send email outside transaction (non-critical path)
    await sendVerificationEmail(email, otp).catch((err) => {
        console.error("Failed to send verification email:", err);
    });
}
export async function login(input, res) {
    const { email, password } = input;
    const user = await prisma.user.findUnique({ where: { email } });
    // Always hash to prevent timing attacks — even if user not found
    const hashToCheck = user?.passwordHash ?? DUMMY_HASH;
    const isValid = await argon2.verify(hashToCheck, password);
    if (!user || !isValid) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }
    if (!user.emailVerified) {
        const error = new Error("Please verify your email before logging in");
        error.statusCode = 403;
        throw error;
    }
    if (user.status !== "active") {
        const error = new Error("Your account has been suspended");
        error.statusCode = 403;
        throw error;
    }
    const accessToken = await issueTokens(res, user.id, user.email, user.accountType, user.role, user.onboardingCompleted);
    return { accessToken };
}
export async function verifyEmail(input) {
    const { email, code } = input;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        const error = new Error("Invalid verification code");
        error.statusCode = 400;
        throw error;
    }
    const record = await prisma.emailVerification.findFirst({
        where: {
            userId: user.id,
            code,
            usedAt: null,
            expiresAt: { gt: new Date() },
        },
    });
    if (!record) {
        const error = new Error("Invalid or expired verification code");
        error.statusCode = 400;
        throw error;
    }
    await prisma.$transaction([
        prisma.emailVerification.update({
            where: { id: record.id },
            data: { usedAt: new Date() },
        }),
        prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: true },
        }),
    ]);
}
export async function resendVerification(input) {
    // Always returns generic message — never reveal if email exists
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || user.emailVerified)
        return;
    const otp = generateOtp();
    await prisma.emailVerification.create({
        data: {
            userId: user.id,
            code: otp,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
    });
    await sendVerificationEmail(input.email, otp).catch((err) => {
        console.error("Failed to send verification email:", err);
    });
}
export async function forgotPassword(input) {
    // Always returns generic message — never reveal if email exists or provider
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || user.authProvider !== "email")
        return;
    const otp = generateOtp();
    await prisma.passwordReset.create({
        data: {
            userId: user.id,
            code: otp,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        },
    });
    await sendPasswordResetEmail(input.email, otp, env.CLIENT_URL).catch((err) => {
        console.error("Failed to send password reset email:", err);
    });
}
export async function resetPassword(input) {
    const { email, token, newPassword } = input;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        const error = new Error("Invalid or expired reset token");
        error.statusCode = 400;
        throw error;
    }
    const record = await prisma.passwordReset.findFirst({
        where: {
            userId: user.id,
            code: token,
            usedAt: null,
            expiresAt: { gt: new Date() },
        },
    });
    if (!record) {
        const error = new Error("Invalid or expired reset token");
        error.statusCode = 400;
        throw error;
    }
    const passwordHash = await argon2.hash(newPassword);
    await prisma.$transaction([
        prisma.passwordReset.update({
            where: { id: record.id },
            data: { usedAt: new Date() },
        }),
        prisma.user.update({
            where: { id: user.id },
            data: { passwordHash },
        }),
    ]);
}
export async function refreshTokens(refreshToken, res) {
    if (!refreshToken) {
        const error = new Error("No refresh token provided");
        error.statusCode = 401;
        throw error;
    }
    let payload;
    try {
        payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    }
    catch {
        const error = new Error("Invalid or expired refresh token");
        error.statusCode = 401;
        throw error;
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== "active") {
        const error = new Error("User not found or inactive");
        error.statusCode = 401;
        throw error;
    }
    const accessToken = await issueTokens(res, user.id, user.email, user.accountType, user.role, user.onboardingCompleted);
    return { accessToken };
}
export function logout(res) {
    res.clearCookie("refresh_token", { path: "/" });
}
export async function completeOnboarding(userId, input, res) {
    const { accountType, role } = input;
    // Delete any existing profile stubs
    await prisma.profile.deleteMany({ where: { userId } });
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            accountType,
            role,
            onboardingCompleted: true,
            profile: { create: {} },
        },
    });
    const accessToken = await issueTokens(res, user.id, user.email, user.accountType, user.role, user.onboardingCompleted);
    return { accessToken };
}
export async function deleteAccount(userId, res) {
    await prisma.user.delete({ where: { id: userId } });
    res.clearCookie("refresh_token", { path: "/" });
}
export async function googleLogin(googleId, email, fullName, avatarUrl, res) {
    let user = await prisma.user.findUnique({ where: { googleId } });
    if (!user) {
        // Try to link by email
        user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            // Link Google to existing email account
            user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId, emailVerified: true },
            });
        }
        else {
            // Create brand new user
            user = await prisma.user.create({
                data: {
                    googleId,
                    email,
                    fullName,
                    authProvider: "google",
                    emailVerified: true,
                    profile: { create: { avatarUrl } },
                },
            });
        }
    }
    if (user.status !== "active") {
        const error = new Error("Your account has been suspended");
        error.statusCode = 403;
        throw error;
    }
    const accessToken = await issueTokens(res, user.id, user.email, user.accountType, user.role, user.onboardingCompleted);
    return { accessToken };
}
//# sourceMappingURL=auth.service.js.map