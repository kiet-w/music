'use client';

import React from 'react';
import { Lock, KeyRound, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';

interface ResetPasswordFormProps {
  otp: string;
  setOtp: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onBackToRequest: () => void;
}

export function ResetPasswordForm({
  otp,
  setOtp,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  loading,
  onSubmit,
  onBackToRequest,
}: ResetPasswordFormProps) {
  const t = useTranslations('Auth');

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-widest font-mono text-muted-foreground" htmlFor="reset-otp">
          {t('otp_placeholder')}
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
          {t('new_password_placeholder')}
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
          {t('confirm_password_placeholder')}
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
        {t('confirm_reset')}
      </Button>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onBackToRequest}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
        >
          {t('send_otp')}
        </button>
      </div>
    </form>
  );
}
