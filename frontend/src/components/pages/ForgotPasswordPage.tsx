'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { forgotPassword, resetPassword } from '@/lib/api';
import { AuthTemplate } from '@/components/templates/Auth/AuthTemplate';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { Mail, Lock, KeyRound, Loader2 } from 'lucide-react';
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
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-widest font-mono text-muted-foreground" htmlFor="reset-email">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" strokeWidth={1.5} />
              <Input
                id="reset-email"
                type="email"
                placeholder="email@example.com"
                className="h-12 rounded-2xl bg-muted/30 border border-white/5 pl-12 text-sm text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-white/20 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-full bg-foreground text-background hover:bg-white/90 active:scale-[0.98] font-medium transition-all text-sm"
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Gửi mã OTP đặt lại mật khẩu
          </Button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-widest font-mono text-muted-foreground" htmlFor="reset-otp">
              Mã OTP (6 chữ số)
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" strokeWidth={1.5} />
              <Input
                id="reset-otp"
                type="text"
                maxLength={6}
                placeholder="123456"
                className="h-12 rounded-2xl bg-muted/30 border border-white/5 pl-12 text-sm text-foreground placeholder:text-muted-foreground/40 font-mono tracking-widest"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-widest font-mono text-muted-foreground" htmlFor="reset-new-password">
              Mật khẩu mới (tối thiểu 8 ký tự)
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" strokeWidth={1.5} />
              <Input
                id="reset-new-password"
                type="password"
                placeholder="••••••••"
                className="h-12 rounded-2xl bg-muted/30 border border-white/5 pl-12 text-sm text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-white/20 transition-all"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-widest font-mono text-muted-foreground" htmlFor="reset-confirm-password">
              Xác nhận lại mật khẩu mới
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" strokeWidth={1.5} />
              <Input
                id="reset-confirm-password"
                type="password"
                placeholder="••••••••"
                className="h-12 rounded-2xl bg-muted/30 border border-white/5 pl-12 text-sm text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-white/20 transition-all"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-full bg-foreground text-background hover:bg-white/90 active:scale-[0.98] font-medium transition-all text-sm"
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Xác nhận đổi mật khẩu
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setStep('request')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Gửi lại yêu cầu OTP
            </button>
          </div>
        </form>
      )}
    </AuthTemplate>
  );
}
