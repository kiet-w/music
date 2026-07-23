'use client';

import React from 'react';
import { User, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface RegisterFormProps {
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword?: string;
  setConfirmPassword?: (value: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  t: (key: string) => string;
}

export function RegisterForm({
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword = '',
  setConfirmPassword,
  loading,
  error,
  onSubmit,
  t
}: RegisterFormProps) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-widest font-mono text-muted-foreground" htmlFor="register-name">
          {t('name')}
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" strokeWidth={1.5} />
          <Input
            id="register-name"
            type="text"
            placeholder={t('name')}
            className="h-12 rounded-2xl bg-muted/30 border border-white/5 pl-12 text-sm text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-white/20 transition-all"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-widest font-mono text-muted-foreground" htmlFor="register-email">
          {t('email')}
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" strokeWidth={1.5} />
          <Input
            id="register-email"
            type="email"
            placeholder={t('email')}
            className="h-12 rounded-2xl bg-muted/30 border border-white/5 pl-12 text-sm text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-white/20 transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-widest font-mono text-muted-foreground" htmlFor="register-password">
          {t('password')}
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" strokeWidth={1.5} />
          <Input
            id="register-password"
            type="password"
            placeholder={t('password')}
            className="h-12 rounded-2xl bg-muted/30 border border-white/5 pl-12 text-sm text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-white/20 transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-widest font-mono text-muted-foreground" htmlFor="register-confirm-password">
          Xác nhận lại mật khẩu
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" strokeWidth={1.5} />
          <Input
            id="register-confirm-password"
            type="password"
            placeholder="Nhập lại mật khẩu"
            className="h-12 rounded-2xl bg-muted/30 border border-white/5 pl-12 text-sm text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-white/20 transition-all"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword && setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button
        type="submit"
        className="h-12 w-full rounded-full bg-foreground text-background hover:bg-white/90 active:scale-[0.98] font-medium transition-all text-sm"
        disabled={loading}
      >
        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
        {t('register_button')}
      </Button>
    </form>
  );
}
