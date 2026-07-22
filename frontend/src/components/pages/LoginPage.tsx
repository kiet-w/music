'use client';

import React, { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { GoogleLoginButton } from '@/components/molecules/Auth/GoogleLoginButton';
import { login } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { AuthTemplate } from '@/components/templates/Auth/AuthTemplate';
import { LoginForm } from '@/components/molecules/Auth/LoginForm';
import { OtpForm } from '@/components/molecules/Auth/OtpForm';

import { getInviteCookie } from '@/lib/inviteCookie';

interface LoginPageProps {
  locale: string;
}

export function LoginPage({ locale }: LoginPageProps) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const pendingCookie = getInviteCookie();
  const defaultRedirect = pendingCookie ? `/${locale}/invite/${pendingCookie}` : `/${locale}`;
  const redirectTarget = searchParams.get('redirect') || defaultRedirect;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtp, setShowOtp] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      router.push(redirectTarget);
    }
  }, [locale, redirectTarget, router, user]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await login({ email, password });
      if (response.accessToken && response.user) {
        setSession(response.accessToken, response.user);
        router.push(redirectTarget);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('xác thực email')) {
        setShowOtp(true);
      } else {
        setError(err.message === 'Invalid email or password' ? t('invalid_credentials') : (err.message || t('error_generic')));
      }
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <p className="text-muted-foreground">
      {t('no_account')}
      <Link
        href={`/${locale}/register`}
        className="ml-1 font-semibold text-foreground transition-colors hover:text-foreground/80 underline underline-offset-4"
      >
        {t('register')}
      </Link>
    </p>
  );

  return (
    <AuthTemplate 
      title={showOtp ? 'Xác thực Email' : t('login')}
      subtitle={showOtp ? 'Tài khoản chưa được xác thực. Nhập mã OTP đã gửi đến email của bạn.' : 'Sign in to continue listening.'}
      footer={footer}
      gradientStyle="bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_36%),linear-gradient(180deg,_#070b14_0%,_#0f172a_100%)]"
    >
      {showOtp ? (
        <OtpForm 
          email={email} 
          onSuccess={() => router.push(`/${locale}`)}
          t={t}
        />
      ) : (
        <>
          <LoginForm 
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
            t={t}
            locale={locale}
          />
          
          <div className="relative py-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-[10px] font-mono font-semibold uppercase tracking-widest text-muted-foreground/60">
                OR
              </span>
            </div>
          </div>

          <GoogleLoginButton />
        </>
      )}
    </AuthTemplate>
  );
}
