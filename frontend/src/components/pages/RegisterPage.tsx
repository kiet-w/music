'use client';

import React, { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { register } from '@/lib/api';
import { AuthTemplate } from '@/components/features/auth/AuthTemplate';
import { RegisterForm } from '@/components/features/auth/forms/RegisterForm';
import { OtpForm } from '@/components/features/auth/forms/OtpForm';

interface RegisterPageProps {
  locale: string;
}

// ponytail: unified register page view with design.md tokens
export function RegisterPage({ locale }: RegisterPageProps) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtp, setShowOtp] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await register({ name, email, password });
      if (response?.requiresVerification) {
        setShowOtp(true);
      } else {
        router.push(`/${locale}`);
      }
    } catch (err: any) {
      if (err.message === 'Email already exists') {
        setError(t('email_exists'));
      } else {
        setError(err.message || t('error_generic'));
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
      title={showOtp ? 'Xác thực Email' : t('register')}
      subtitle={showOtp ? 'Nhập mã OTP đã được gửi đến email của bạn' : t('have_account')}
      footer={footer}
      gradientStyle="bg-background"
    >
      {showOtp ? (
        <OtpForm 
          email={email}
          onSuccess={() => router.push(`/${locale}`)}
          t={t}
        />
      ) : (
        <RegisterForm 
          name={name}
          setName={setName}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          loading={loading}
          error={error}
          onSubmit={handleSubmit}
          t={t}
        />
      )}
    </AuthTemplate>
  );
}

