'use client';

import React, { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { register } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { AuthTemplate } from '@/components/templates/Auth/AuthTemplate';
import { RegisterForm } from '@/components/molecules/Auth/RegisterForm';

interface RegisterPageProps {
  locale: string;
}

export function RegisterPage({ locale }: RegisterPageProps) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await register({ name, email, password });
      useAuthStore.getState().setSession(response.accessToken, response.user);
      router.push(`/${locale}`);
    } catch (err: any) {
      if (err.message === 'Email already exists') {
        setError(t('email_exists'));
      } else {
        setError(t('error_generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <p className="text-muted-foreground">
      {t('have_account')}
      <Link
        href={`/${locale}/login`}
        className="ml-1 font-semibold text-foreground transition-colors hover:text-foreground/80 underline underline-offset-4"
      >
        {t('login')}
      </Link>
    </p>
  );

  return (
    <AuthTemplate 
      title={t('register')}
      subtitle={t('have_account')}
      footer={footer}
      gradientStyle="bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_34%),linear-gradient(180deg,_#07111f_0%,_#111827_100%)]"
    >
      <RegisterForm 
        name={name}
        setName={setName}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        t={t}
      />
    </AuthTemplate>
  );
}
