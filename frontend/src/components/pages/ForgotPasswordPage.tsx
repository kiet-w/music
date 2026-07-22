'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { forgotPassword, resetPassword } from '@/lib/api';
import { AuthTemplate } from '@/components/templates/Auth/AuthTemplate';
import { ForgotPasswordForm } from '@/components/molecules/Auth/ForgotPasswordForm';
import { ResetPasswordForm } from '@/components/molecules/Auth/ResetPasswordForm';
import { toast } from 'sonner';

interface ForgotPasswordPageProps {
  locale: string;
}

export function ForgotPasswordPage({ locale }: ForgotPasswordPageProps) {
  const t = useTranslations('Auth');
  const router = useRouter();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await forgotPassword(email.trim());
      toast.success(res.message || 'Mã OTP đặt lại mật khẩu đã được gửi!');
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setError('Mã OTP phải có 6 chữ số');
      return;
    }
    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      toast.success(res.message || 'Đặt lại mật khẩu thành công!');
      router.push(`/${locale}/login`);
    } catch (err: any) {
      setError(err.message || 'Mã OTP không đúng hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <p className="text-muted-foreground">
      Đã nhớ mật khẩu?
      <Link
        href={`/${locale}/login`}
        className="ml-1 font-semibold text-foreground transition-colors hover:text-foreground/80 underline underline-offset-4"
      >
        Đăng nhập
      </Link>
    </p>
  );

  return (
    <AuthTemplate
      title={step === 'request' ? 'Quên mật khẩu' : 'Đặt lại mật khẩu'}
      subtitle={
        step === 'request'
          ? 'Nhập địa chỉ email để nhận mã OTP đặt lại mật khẩu'
          : `Nhập mã OTP 6 chữ số gửi tới ${email} và mật khẩu mới`
      }
      footer={footer}
      gradientStyle="bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.15),_transparent_36%),linear-gradient(180deg,_#0f0714_0%,_#170f1e_100%)]"
    >
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 mb-4 text-center">
          {error}
        </div>
      )}

      {step === 'request' ? (
        <ForgotPasswordForm
          email={email}
          setEmail={setEmail}
          loading={loading}
          onSubmit={handleRequestOtp}
        />
      ) : (
        <ResetPasswordForm
          otp={otp}
          setOtp={setOtp}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          loading={loading}
          onSubmit={handleResetPassword}
          onBackToRequest={() => setStep('request')}
        />
      )}
    </AuthTemplate>
  );
}
