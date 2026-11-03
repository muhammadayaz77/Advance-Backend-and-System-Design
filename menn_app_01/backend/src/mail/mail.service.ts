import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.MAIL_HOST,
  port: env.MAIL_PORT,
  secure: env.MAIL_SECURE || env.MAIL_PORT === 465,
  auth:
    env.MAIL_USER && env.MAIL_PASS
      ? { user: env.MAIL_USER, pass: env.MAIL_PASS }
      : undefined,
});

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${env.MAIL_FROM_NAME}</title>
  <style>
    body { margin: 0; padding: 0; background: #0f0f13; font-family: 'Segoe UI', Arial, sans-serif; }
    .container { max-width: 560px; margin: 40px auto; background: #1a1a24; border-radius: 16px; overflow: hidden; border: 1px solid #2a2a3a; }
    .header { background: linear-gradient(135deg, #6c47ff 0%, #a855f7 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .body { padding: 40px 32px; }
    .body p { color: #a0a0b8; margin: 0 0 16px; line-height: 1.6; font-size: 15px; }
    .otp-box { background: #0f0f18; border: 1px solid #2a2a3a; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp { font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #a855f7; font-family: 'Courier New', monospace; }
    .note { font-size: 13px !important; color: #8888aa !important; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6c47ff, #a855f7); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 16px 0; }
    .footer { padding: 24px 32px; border-top: 1px solid #2a2a3a; }
    .footer p { color: #505068; font-size: 12px; margin: 0; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 ${env.MAIL_FROM_NAME}</h1>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>This email was sent automatically. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function sendVerification(
  email: string,
  fullName: string,
  code: string
): Promise<void> {
  console.log(`\n========================================`);
  console.log(`📧 [DEV EMAIL] Verification Code for ${fullName} <${email}>: [ ${code} ]`);
  console.log(`========================================\n`);

  try {
    const html = baseTemplate(`
      <p>Hello ${fullName || "there"},</p>
      <p>Welcome to ${env.MAIL_FROM_NAME}! Please verify your email address to get started.</p>
      <p>Enter the following code on the verification page:</p>
      <div class="otp-box">
        <div class="otp">${code}</div>
      </div>
      <p class="note">This code expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.</p>
    `);

    await transporter.sendMail({
      from: `"${env.MAIL_FROM_NAME}" <${env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Verify your email address - ${env.MAIL_FROM_NAME}`,
      html,
    });
  } catch (error) {
    console.error("Failed to send verification email (silently caught):", error);
  }
}

export async function sendPasswordReset(
  email: string,
  fullName: string,
  resetLink: string
): Promise<void> {
  console.log(`\n========================================`);
  console.log(`📧 [DEV EMAIL] Password Reset for ${fullName} <${email}>:`);
  console.log(`   Link: ${resetLink}`);
  console.log(`========================================\n`);

  try {
    const html = baseTemplate(`
      <p>Hello ${fullName || "there"},</p>
      <p>We received a request to reset your password for ${env.MAIL_FROM_NAME}.</p>
      <p>Click the button below to reset your password:</p>
      <p style="text-align:center">
        <a href="${resetLink}" class="btn">Reset Password</a>
      </p>
      <p class="note">Or copy and paste this link into your browser:<br/><a href="${resetLink}" style="color:#a855f7;">${resetLink}</a></p>
      <p class="note">This link expires in <strong>15 minutes</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
    `);

    await transporter.sendMail({
      from: `"${env.MAIL_FROM_NAME}" <${env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: `Reset your password - ${env.MAIL_FROM_NAME}`,
      html,
    });
  } catch (error) {
    console.error("Failed to send password reset email (silently caught):", error);
  }
}

// Aliases for compatibility
export const sendVerificationEmail = (email: string, code: string, fullName = "") =>
  sendVerification(email, fullName, code);

export const sendPasswordResetEmail = (email: string, code: string, clientUrl: string, fullName = "") => {
  const resetLink = `${clientUrl}/reset-password?email=${encodeURIComponent(email)}&token=${code}`;
  return sendPasswordReset(email, fullName, resetLink);
};
