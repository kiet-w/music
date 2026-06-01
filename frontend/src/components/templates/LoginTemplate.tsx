'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, Music } from 'lucide-react';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
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
    <div className="flex flex-col min-h-dvh px-6 py-12 bg-gradient-to-br from-background via-background/95 to-primary/10 relative overflow-hidden items-center justify-center">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-5%] left-[-5%] w-48 h-48 bg-primary/10 rounded-full blur-3xl" />

      <div className="w-full max-w-[400px] relative z-10 space-y-10">
        <header className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150" />
            <div className="relative p-5 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl">
              <Music className="w-10 h-10 text-primary" strokeWidth={1.5} />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-instrument italic tracking-tighter text-foreground">{t('login')}</h1>
            <p className="text-sm text-muted-foreground font-sans">{t('login_button')}</p>
          </div>
        </header>

        <main className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" strokeWidth={1.5} />
                <Input
                  type="email"
                  placeholder={t('email')}
                  className="pl-12 h-14 bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/40 text-base placeholder:text-muted-foreground/40"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" strokeWidth={1.5} />
                <Input
                  type="password"
                  placeholder={t('password')}
                  className="pl-12 h-14 bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/40 text-base placeholder:text-muted-foreground/40"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium text-center backdrop-blur-md">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-14 text-base font-semibold rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all bg-primary hover:bg-primary/90" 
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {t('login_button')}
            </Button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                <span className="bg-transparent px-4 text-muted-foreground/40 backdrop-blur-sm">OR</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-14 text-base font-medium rounded-2xl border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 active:scale-[0.98] transition-all"
              onClick={handleGoogleLogin}
            >
              <GoogleIcon />
              {t('google_login')}
            </Button>
          </form>

          <footer className="text-center text-sm font-sans pt-4">
            <p className="text-muted-foreground/60">
              {t('no_account')}{' '}
              <Link href={`/${locale}/register`} className="text-primary hover:text-primary/80 font-bold transition-all ml-1">
                {t('register')}
              </Link>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
