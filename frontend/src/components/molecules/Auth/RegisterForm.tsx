'use client';

import React from 'react';
import { User, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';

interface RegisterFormProps {
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
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
  loading,
  error,
  onSubmit,
  t
}: RegisterFormProps) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80" htmlFor="register-name">
          {t('name')}
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" strokeWidth={1.5} />
          <Input
            id="register-name"
            type="text"
            placeholder={t('name')}
            className="h-14 rounded-2xl border-white/10 bg-white/5 pl-12 text-base placeholder:text-muted-foreground/40 backdrop-blur-xl focus-visible:ring-1 focus-visible:ring-primary/40"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80" htmlFor="register-email">
          {t('email')}
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" strokeWidth={1.5} />
          <Input
            id="register-email"
            type="email"
            placeholder={t('email')}
            className="h-14 rounded-2xl border-white/10 bg-white/5 pl-12 text-base placeholder:text-muted-foreground/40 backdrop-blur-xl focus-visible:ring-1 focus-visible:ring-primary/40"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80" htmlFor="register-password">
          {t('password')}
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" strokeWidth={1.5} />
          <Input
            id="register-password"
            type="password"
            placeholder={t('password')}
            className="h-14 rounded-2xl border-white/10 bg-white/5 pl-12 text-base placeholder:text-muted-foreground/40 backdrop-blur-xl focus-visible:ring-1 focus-visible:ring-primary/40"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button
        type="submit"
        className="h-14 w-full rounded-2xl bg-primary text-base font-semibold shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 active:scale-[0.98]"
        disabled={loading}
      >
        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
        {t('register_button')}
      </Button>
    </form>
  );
}
