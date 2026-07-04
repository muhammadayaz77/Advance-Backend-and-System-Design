import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailService {
  private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>;
  private readonly logger = new Logger(MailService.name);
  private readonly fromHeader: string;

  constructor(private readonly config: ConfigService) {
    const port = config.getOrThrow<number>('MAIL_PORT');

    const useSecure = port === 465;
    const transportOptions: SMTPTransport.Options = {
      host: config.getOrThrow<string>('MAIL_HOST'),
      port,
      secure: useSecure,
      ...(port === 587 && { requireTLS: true }),
      auth: {
        user: config.getOrThrow<string>('MAIL_USER'),
        pass: config.getOrThrow<string>('MAIL_PASS'),
      },
    };
    this.transporter = nodemailer.createTransport(transportOptions);

    const fromName = config.get<string>('MAIL_FROM_NAME') ?? 'WorkSphere';
    const fromAddress = config.getOrThrow<string>('MAIL_FROM_ADDRESS');
    this.fromHeader = `"${fromName}" <${fromAddress}>`;
  }

  async sendVerification(
    email: string,
    fullName: string,
    code: string,
  ): Promise<void> {
    await this.send({
      to: email,
      subject: 'Verify your WorkSphere account',
      html: this.verificationTemplate(fullName, code),
    });
  }

  async sendPasswordReset(
    email: string,
    fullName: string,
    resetLink: string,
  ): Promise<void> {
    await this.send({
      to: email,
      subject: 'Reset your WorkSphere password',
      html: this.passwordResetTemplate(fullName, resetLink),
    });
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────────

  private async send(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({ from: this.fromHeader, ...options });
    } catch (err) {
      this.logger.error(
        `Failed to send "${options.subject}" to ${options.to}: ${String(err)}`,
      );
      // Do not re-throw — mail failures should not crash the calling flow
    }
  }

  private verificationTemplate(name: string, code: string): string {
    return `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#111">
        <h2 style="margin-bottom:8px">Verify your email, ${name}</h2>
        <p style="color:#555">Enter the code below inside WorkSphere. It expires in <strong>24 hours</strong>.</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:10px;text-align:center;
                    padding:24px;background:#f4f4f5;border-radius:8px;margin:24px 0">
          ${code}
        </div>
        <p style="color:#999;font-size:12px">
          If you didn't create a WorkSphere account, you can safely ignore this email.
        </p>
      </div>
    `;
  }

  private passwordResetTemplate(name: string, resetLink: string): string {
    return `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#111">
        <h2 style="margin-bottom:8px">Reset your password, ${name}</h2>
        <p style="color:#555">
          Click the button below to reset your password. This link expires in <strong>15 minutes</strong>.
        </p>
        <div style="margin:24px 0;text-align:center">
          <a
            href="${resetLink}"
            style="display:inline-block;background:#22c55e;color:#fff;text-decoration:none;
                   padding:12px 24px;border-radius:8px;font-weight:600"
          >
            Reset Password
          </a>
        </div>
        <p style="color:#666;font-size:12px;word-break:break-all">
          If the button does not work, paste this link in your browser:<br />
          <a href="${resetLink}">${resetLink}</a>
        </p>
        <p style="color:#999;font-size:12px">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `;
  }
}
