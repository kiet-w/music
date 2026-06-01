'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, Music } from 'lucide-react';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/atoms/ui/card';
import { login } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
  </svg>
);

export default function LoginTemplate({ locale }: { locale: string }) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await login({ email, password });
      useAuthStore.getState().setSession(response.accessToken, response.user);
      router.push(`/${locale}`);
    } catch (err: any) {
      setError(err.message === 'Invalid email or password' ? t('invalid_credentials') : t('error_generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log('Google login clicked');
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-[400px] border-none shadow-none bg-transparent sm:border sm:shadow-sm sm:bg-card">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150" />
              <div className="relative p-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl">
                <Music className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-serif italic tracking-tight">{t('login')}</CardTitle>
            <p className="text-sm text-muted-foreground">{t('login_button')}</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                <Input
                  type="email"
                  placeholder={t('email')}
                  className="pl-10 h-11 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/30 text-[16px]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                <Input
                  type="password"
                  placeholder={t('password')}
                  className="pl-10 h-11 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/30 text-[16px]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium text-center">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-11 text-[16px] font-semibold rounded-xl shadow-lg shadow-primary/20" 
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {t('login_button')}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                <span className="bg-card px-4 text-muted-foreground/40">OR</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 text-[15px] font-medium rounded-xl border-muted bg-transparent hover:bg-muted/30 transition-all"
              onClick={handleGoogleLogin}
            >
              <GoogleIcon />
              {t('google_login')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="pt-6 text-center text-[14px]">
          <p className="w-full text-muted-foreground/60">
            {t('no_account')}{' '}
            <Link href={`/${locale}/register`} className="text-primary hover:underline font-bold ml-1">
              {t('register')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
