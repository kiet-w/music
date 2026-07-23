'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { forgotPassword, resetPassword } from '@/lib/api';
import { AuthTemplate } from '@/components/features/auth/AuthTemplate';
import { ForgotPasswordForm } from '@/components/features/auth/forms/ForgotPasswordForm';
import { ResetPasswordForm } from '@/components/features/auth/forms/ResetPasswordForm';
import { toast } from 'sonner';

interface ForgotPasswordPageProps {
  locale: string;
}

function ForgotPasswordContent({ locale }: ForgotPasswordPageProps) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null); // OTP shown inline when backend returns it directly

  // Auto-fill from URL parameters (e.g. ?email=user@example.com&otp=123456 or ?token=123456)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const otpParam = searchParams.get('otp') || searchParams.get('token');

    if (emailParam) {
      setEmail(emailParam);
    }
    if (otpParam) {
      setOtp(otpParam);
    }
    if (emailParam || otpParam) {
      setStep('reset');
    }
  }, [searchParams]);

  // Lock page navigation when in mandatory reset step
  useEffect(() => {
    if (step !== 'reset') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Bạn đang trong quá trình đặt lại mật khẩu. Vui lòng hoàn tất đổi mật khẩu!';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [step]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await forgotPassword(email.trim());

      if (res?.otp) {
        // Dev/staging: backend returns OTP directly — auto-fill + show inline banner
        setOtp(res.otp);
        setDevOtp(res.otp);
        toast.success('Mã OTP đã sẵn sàng!');
        setStep('reset');
      } else {
        // Email not found in DB (anti-enumeration) — backend returns generic message without OTP
        // The message contains the hint: "Nếu email tồn tại..."
        const isUnregistered = res?.message?.includes('tồn tại') || res?.message?.includes('exist');
        if (isUnregistered) {
          setError('Email này chưa được đăng ký trong hệ thống. Vui lòng kiểm tra lại hoặc tạo tài khoản mới.');
        } else {
          toast.success(res?.message || 'Mã OTP đặt lại mật khẩu đã được gửi tới email của bạn!');
          setStep('reset');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email.trim() || resendingOtp) return;
    setResendingOtp(true);
    setError(null);
    setDevOtp(null);
    try {
      const res = await forgotPassword(email.trim());
      if (res?.otp) {
        setOtp(res.otp);
        setDevOtp(res.otp);
        toast.success('Mã OTP mới đã sẵn sàng!');
      } else {
        toast.success(res?.message || 'Đã gửi lại mã OTP tới email của bạn!');
      }
    } catch (err: any) {
      setError(err.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.');
    } finally {
      setResendingOtp(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setError('Mã OTP phải có đúng 6 chữ số');
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
      toast.success(res.message || 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.');
      router.push(`/${locale}/login`);
    } catch (err: any) {
      setError(err.message || 'Mã OTP không đúng hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  const footer = step === 'request' ? (
    <p className="text-muted-foreground">
      Đã nhớ mật khẩu?
      <Link
        href={`/${locale}/login`}
        className="ml-1 font-semibold text-foreground transition-colors hover:text-foreground/80 underline underline-offset-4"
      >
        Đăng nhập
      </Link>
    </p>
  ) : (
    <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-white/70 text-center font-medium">
      Yêu cầu bắt buộc: Hoàn tất đặt lại mật khẩu để tiếp tục sử dụng hệ thống.
    </div>
  );

  return (
    <AuthTemplate
      title={step === 'request' ? 'Quên mật khẩu' : 'Đặt lại mật khẩu (Bắt buộc)'}
      subtitle={
        step === 'request'
          ? 'Nhập địa chỉ email để nhận mã OTP đặt lại mật khẩu'
          : `Đang xử lý đặt lại mật khẩu cho tài khoản ${email}`
      }
      footer={footer}
      gradientStyle="bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.15),_transparent_36%),linear-gradient(180deg,_#0f0714_0%,_#170f1e_100%)]"
    >
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 mb-4 text-center">
          {error}
        </div>
      )}

      {/* Dev/staging inline OTP banner — shown when backend returns OTP directly */}
      {devOtp && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 mb-4 text-center space-y-1">
          <p className="text-xs text-emerald-400 font-mono uppercase tracking-widest">Mã OTP của bạn</p>
          <p className="text-3xl font-mono font-bold tracking-[0.3em] text-emerald-300 select-all">{devOtp}</p>
          <p className="text-[10px] text-muted-foreground">Mã đã được tự động điền. Hiệu lực 15 phút.</p>
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
          email={email}
          otp={otp}
          setOtp={setOtp}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          loading={loading}
          resendingOtp={resendingOtp}
          onSubmit={handleResetPassword}
          onResendOtp={handleResendOtp}
        />
      )}
    </AuthTemplate>
  );
}

export function ForgotPasswordPage({ locale }: ForgotPasswordPageProps) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#0f0714] text-white font-mono text-sm">
        Đang tải trang đặt lại mật khẩu...
      </div>
    }>
      <ForgotPasswordContent locale={locale} />
    </Suspense>
  );
}
