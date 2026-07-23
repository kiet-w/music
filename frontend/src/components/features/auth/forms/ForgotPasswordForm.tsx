'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ForgotPasswordFormProps {
  email: string;
  setEmail: (value: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function ForgotPasswordForm({
  email,
  setEmail,
  loading,
  onSubmit,
}: ForgotPasswordFormProps) {
  const t = useTranslations('Auth');

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-widest font-mono text-muted-foreground" htmlFor="reset-email">
          {t('email')}
        </label>
        <div className="relative">
          <Input
            id="reset-email"
            type="email"
            placeholder="email@example.com"
            className="h-12 rounded-2xl bg-muted/30 border border-white/5 px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-white/20 transition-all"
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
        {t('send_otp')}
      </Button>
    </form>
  );
}
