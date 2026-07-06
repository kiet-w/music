'use client';

import React from 'react';
import { User, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/atoms/ui/button';
import { FormField } from '@/components/atoms/FormField';

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
      <FormField
        id="register-name"
        label={t('name')}
        type="text"
        placeholder={t('name')}
        value={name}
        onChange={setName}
        icon={User}
        required
      />

      <FormField
        id="register-email"
        label={t('email')}
        type="email"
        placeholder={t('email')}
        value={email}
        onChange={setEmail}
        icon={Mail}
        required
      />

      <FormField
        id="register-password"
        label={t('password')}
        type="password"
        placeholder={t('password')}
        value={password}
        onChange={setPassword}
        icon={Lock}
        required
      />

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
