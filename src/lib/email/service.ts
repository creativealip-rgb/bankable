/**
 * Framework for Email delivery.
 * In the future, this will connect to Resend, SendGrid, etc.
 */

export type EmailProvider = "RESEND" | "NODEMAILER" | "CONSOLE";

export type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export class EmailService {
  private provider: EmailProvider;

  constructor(provider: EmailProvider = "CONSOLE") {
    this.provider = provider;
  }

  async send(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    console.log(`[EMAIL FRAMEWORK] Sending email via ${this.provider}:`, {
      to: options.to,
      subject: options.subject,
    });

    if (this.provider === "CONSOLE") {
      console.log("--- EMAIL CONTENT START ---");
      console.log(options.html);
      console.log("--- EMAIL CONTENT END ---");
      return { success: true };
    }

    // Future integrations here
    return {
      success: false,
      error: "Email provider not configured or implemented.",
    };
  }

  /**
   * Specifically for Better Auth integration
   */
  async sendOTP(email: string, otp: string, type: "sign-in" | "email-verification" | "forget-password" | "change-email") {
    const subjectMap: Record<string, string> = {
      "sign-in": "Kode Login BELAJARIA",
      "email-verification": "Verifikasi Email BELAJARIA",
      "forget-password": "Reset Kata Sandi BELAJARIA",
      "change-email": "Konfirmasi Perubahan Email BELAJARIA",
    };
    const descMap: Record<string, string> = {
      "sign-in": "login ke akun Anda",
      "email-verification": "verifikasi akun",
      "forget-password": "reset kata sandi",
      "change-email": "konfirmasi perubahan email",
    };
    const subject = subjectMap[type] || "Kode OTP BELAJARIA";
    const desc = descMap[type] || type;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4F46E5;">BELAJARIA</h2>
        <p>Halo,</p>
        <p>Kode Anda untuk ${desc} adalah:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; border-radius: 8px;">
          ${otp}
        </div>
        <p>Kode ini akan kadaluarsa dalam 10 menit. Jangan bagikan kode ini kepada siapapun.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666;">Jika Anda tidak merasa melakukan permintaan ini, silakan abaikan email ini.</p>
      </div>
    `;

    return this.send({ to: email, subject, html });
  }
}

import { env } from "@/lib/env";

export const emailService = new EmailService(
  env.EMAIL_PROVIDER as EmailProvider
);
