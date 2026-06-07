'use client';

import React, { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { GoogleLoginButton } from '@/components/molecules/Auth/GoogleLoginButton';
import { login } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { AuthTemplate } from '@/components/templates/Auth/AuthTemplate';
import { LoginForm } from '@/components/molecules/Auth/LoginForm';

interface LoginPageProps {
  locale: string;
}

export function LoginPage({ locale }: LoginPageProps) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((state) => state.setSession);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      router.push(`/${locale}`);
    }
  }, [locale, router, user]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await login({ email, password });
      setSession(response.accessToken, response.user);
      router.push(`/${locale}`);
    } catch (err: any) {
      setError(err.message === 'Invalid email or password' ? t('invalid_credentials') : t('error_generic'));
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <p className="text-muted-foreground/70">
      {t('no_account')}
      <Link
        href={`/${locale}/register`}
        className="ml-1 font-semibold text-primary transition-colors hover:text-primary/80"
      >
        {t('register')}
      </Link>
    </p>
  );

  return (
    <AuthTemplate 
      title={t('login')}
      subtitle="Sign in to continue listening."
      footer={footer}
      gradientStyle="bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_36%),linear-gradient(180deg,_#070b14_0%,_#0f172a_100%)]"
    >
      <LoginForm 
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        t={t}
      />
      
      <div className="relative py-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-transparent px-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/40">
            OR
          </span>
        </div>
      </div>

      <GoogleLoginButton />
    </AuthTemplate>
  );
}
