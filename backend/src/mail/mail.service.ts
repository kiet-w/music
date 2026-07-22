import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/^["']|["']$/g, '').replace(/\s+/g, '') : undefined;

    if (user && pass) {
      const isGmail = host.includes('gmail');
      this.transporter = nodemailer.createTransport(
        isGmail
          ? {
              service: 'gmail',
              auth: { user, pass },
              tls: { rejectUnauthorized: false },
            }
          : {
              host,
              port,
              secure: port === 465,
              auth: { user, pass },
              tls: { rejectUnauthorized: false },
            }
      );
      this.logger.log(`Nodemailer SMTP transporter initialized (${isGmail ? 'Gmail Service' : host})`);
    } else {
      this.logger.warn(
        'SMTP_USER and SMTP_PASS not set. Emails will be logged to console in dev mode.',
      );
    }
  }

  async sendVerificationOtp(toEmail: string, otp: string): Promise<void> {
    const rawFrom = process.env.MAIL_FROM || 'Music App <lpokmoppokida@gmail.com>';
    const from = rawFrom.replace(/^["']|["']$/g, '');
    const subject = '[Music App] Mã xác nhận đăng ký tài khoản (OTP)';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; borderRadius: 8px;">
        <h2 style="color: #6d28d9; text-align: center;">Xác thực tài khoản Music App</h2>
        <p>Xin chào,</p>
        <p>Mã OTP để xác thực địa chỉ email của bạn là:</p>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1f2937;">
          ${otp}
        </div>
        <p style="color: #6b7280; font-size: 13px; margin-top: 15px;">Mã này có hiệu lực trong 10 phút. Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
      </div>
    `;

    // Always log OTP to server console for easy fallback debugging
    this.logger.log(`🔑 [Verification OTP] Email: ${toEmail} | Code: ${otp}`);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({ from, to: toEmail, subject, html });
        this.logger.log(`Verification OTP email sent to ${toEmail}`);
      } catch (error: any) {
        this.logger.error(`Failed to send email to ${toEmail}: ${error?.message || error}`);
      }
    }
  }

  async sendPasswordResetOtp(toEmail: string, otp: string): Promise<void> {
    const rawFrom = process.env.MAIL_FROM || 'Music App <lpokmoppokida@gmail.com>';
    const from = rawFrom.replace(/^["']|["']$/g, '');
    const subject = '[Music App] Đặt lại mật khẩu (OTP)';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; borderRadius: 8px;">
        <h2 style="color: #dc2626; text-align: center;">Yêu cầu đặt lại mật khẩu</h2>
        <p>Xin chào,</p>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản Music App. Mã OTP của bạn là:</p>
        <div style="background-color: #fef2f2; padding: 15px; text-align: center; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #991b1b;">
          ${otp}
        </div>
        <p style="color: #6b7280; font-size: 13px; margin-top: 15px;">Mã có hiệu lực trong 15 phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
      </div>
    `;

    // Always log OTP to server console for easy fallback debugging
    this.logger.log(`🔑 [Password Reset OTP] Email: ${toEmail} | Code: ${otp}`);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({ from, to: toEmail, subject, html });
        this.logger.log(`Password reset OTP email sent to ${toEmail}`);
      } catch (error: any) {
        this.logger.error(`Failed to send reset email to ${toEmail}: ${error?.message || error}`);
      }
    }
  }
}
