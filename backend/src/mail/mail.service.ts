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
    const pass = process.env.SMTP_PASS;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log('Nodemailer SMTP transporter initialized');
    } else {
      this.logger.warn(
        'SMTP_USER and SMTP_PASS not set. Emails will be logged to console in dev mode.',
      );
    }
  }

  async sendVerificationOtp(toEmail: string, otp: string): Promise<void> {
    const from = process.env.MAIL_FROM || '"Music App" <no-reply@musicapp.com>';
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

    if (this.transporter) {
      try {
        await this.transporter.sendMail({ from, to: toEmail, subject, html });
        this.logger.log(`Verification OTP email sent to ${toEmail}`);
      } catch (error) {
        this.logger.error(`Failed to send email to ${toEmail}: ${error.message}`);
      }
    } else {
      this.logger.log(`[DEV MODE] Verification OTP for ${toEmail}: ${otp}`);
    }
  }

  async sendPasswordResetOtp(toEmail: string, otp: string): Promise<void> {
    const from = process.env.MAIL_FROM || '"Music App" <no-reply@musicapp.com>';
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

    if (this.transporter) {
      try {
        await this.transporter.sendMail({ from, to: toEmail, subject, html });
        this.logger.log(`Password reset OTP email sent to ${toEmail}`);
      } catch (error) {
        this.logger.error(`Failed to send reset email to ${toEmail}: ${error.message}`);
      }
    } else {
      this.logger.log(`[DEV MODE] Password Reset OTP for ${toEmail}: ${otp}`);
    }
  }
}
