import nodemailer from "nodemailer";
import { env } from "../config/env.js";
const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
});
function baseTemplate(content) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email</title>
  <style>
    body { margin: 0; padding: 0; background: #0f0f13; font-family: 'Segoe UI', Arial, sans-serif; }
    .container { max-width: 560px; margin: 40px auto; background: #1a1a24; border-radius: 16px; overflow: hidden; border: 1px solid #2a2a3a; }
    .header { background: linear-gradient(135deg, #6c47ff 0%, #a855f7 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .body { padding: 40px 32px; }
    .body p { color: #a0a0b8; margin: 0 0 16px; line-height: 1.6; font-size: 15px; }
    .otp-box { background: #0f0f18; border: 1px solid #2a2a3a; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp { font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #a855f7; font-family: 'Courier New', monospace; }
    .note { font-size: 13px !important; color: #6060778 !important; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6c47ff, #a855f7); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 16px 0; }
    .footer { padding: 24px 32px; border-top: 1px solid #2a2a3a; }
    .footer p { color: #505068; font-size: 12px; margin: 0; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 AuthFlow</h1>
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
export async function sendVerificationEmail(to, code) {
    console.log(`\n========================================`);
    console.log(`📧 [DEV EMAIL] Verification Code for ${to}: [ ${code} ]`);
    console.log(`========================================\n`);
    if (!env.SMTP_USER || !env.SMTP_PASS) {
        return;
    }
    const html = baseTemplate(`
    <p>Welcome! Please verify your email address to get started.</p>
    <p>Enter the following code on the verification page:</p>
    <div class="otp-box">
      <div class="otp">${code}</div>
    </div>
    <p class="note">This code expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.</p>
  `);
    await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject: "Verify your email address",
        html,
    });
}
export async function sendPasswordResetEmail(to, code, clientUrl) {
    const resetLink = `${clientUrl}/reset-password?email=${encodeURIComponent(to)}&token=${code}`;
    console.log(`\n========================================`);
    console.log(`📧 [DEV EMAIL] Password Reset for ${to}:`);
    console.log(`   OTP: [ ${code} ]`);
    console.log(`   Link: ${resetLink}`);
    console.log(`========================================\n`);
    if (!env.SMTP_USER || !env.SMTP_PASS) {
        return;
    }
    const html = baseTemplate(`
    <p>We received a request to reset your password.</p>
    <p>Use the code below or click the button to reset your password:</p>
    <div class="otp-box">
      <div class="otp">${code}</div>
    </div>
    <p style="text-align:center">
      <a href="${resetLink}" class="btn">Reset Password</a>
    </p>
    <p class="note">This link expires in <strong>15 minutes</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
  `);
    await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject: "Reset your password",
        html,
    });
}
//# sourceMappingURL=mail.service.js.map