'use client';

import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ResetPasswordFormProps {
  email: string;
  otp: string;
  setOtp: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  loading: boolean;
  resendingOtp?: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onResendOtp?: () => void;
}

export function ResetPasswordForm({
  email,
  otp,
  setOtp,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  loading,
  resendingOtp,
  onSubmit,
  onResendOtp,
}: ResetPasswordFormProps) {
  const t = useTranslations('Auth');

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Locked Email Badge */}
      <div className="flex items-center rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-xs text-muted-foreground font-mono">
        <span className="truncate">Tài khoản: <strong className="text-foreground">{email}</strong></span>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-widest font-mono text-muted-foreground" htmlFor="reset-otp">
          Mã xác thực OTP (6 chữ số)
        </label>
        <div className="relative">
          <Input
            id="reset-otp"
            type="text"
            maxLength={6}
            placeholder="123456"
            className="h-12 rounded-2xl bg-muted/30 border border-white/5 px-4 pr-28 text-sm text-foreground placeholder:text-muted-foreground/40 font-mono tracking-widest"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            required
          />
          {onResendOtp && (
            <button
              type="button"
              onClick={onResendOtp}
              disabled={resendingOtp || loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-white/70 hover:text-white disabled:opacity-50 transition-colors flex items-center gap-1"
            >
              {resendingOtp ? <RefreshCw className="h-3 w-3 animate-spin" /> : null}
              Gửi lại OTP
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-widest font-mono text-muted-foreground" htmlFor="reset-new-password">
          Mật khẩu mới (Tối thiểu 8 ký tự)
        </label>
        <div className="relative">
          <Input
            id="reset-new-password"
            type="password"
            placeholder="••••••••"
            className="h-12 rounded-2xl bg-muted/30 border border-white/5 px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-white/20 transition-all"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-widest font-mono text-muted-foreground" htmlFor="reset-confirm-password">
          Xác nhận mật khẩu mới
        </label>
        <div className="relative">
          <Input
            id="reset-confirm-password"
            type="password"
            placeholder="••••••••"
            className="h-12 rounded-2xl bg-muted/30 border border-white/5 px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-white/20 transition-all"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="h-12 w-full rounded-full bg-white hover:bg-zinc-200 text-black font-bold transition-all text-sm"
        disabled={loading}
      >
        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
        Xác nhận đổi mật khẩu
      </Button>
    </form>
  );
}
