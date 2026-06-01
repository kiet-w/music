'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Loader2, Music } from 'lucide-react';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { register } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';

export default function RegisterTemplate({ locale }: { locale: string }) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <div className="flex flex-col min-h-dvh px-6 pt-12 pb-8 bg-gradient-to-br from-background via-background/95 to-primary/10 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-5%] left-[-5%] w-48 h-48 bg-primary/10 rounded-full blur-3xl" />

      <header className="flex flex-col items-center space-y-6 mb-12 relative z-10">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150" />
          <div className="relative p-5 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl">
            <Music className="w-10 h-10 text-primary" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-serif italic tracking-tight text-foreground">{t('register')}</h1>
          <p className="text-[15px] text-muted-foreground/80">{t('register_button')}</p>
        </div>
      </header>

      <main className="flex-1 max-w-sm mx-auto w-full relative z-10">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="relative group">
              <User className="absolute left-4 top-4 h-5 w-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder={t('name')}
                className="pl-12 h-14 bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/40 text-[16px] placeholder:text-muted-foreground/40"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="relative group">
              <Mail className="absolute left-4 top-4 h-5 w-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
              <Input
                type="email"
                placeholder={t('email')}
                className="pl-12 h-14 bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/40 text-[16px] placeholder:text-muted-foreground/40"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-4 h-5 w-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
              <Input
                type="password"
                placeholder={t('password')}
                className="pl-12 h-14 bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/40 text-[16px] placeholder:text-muted-foreground/40"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium text-center backdrop-blur-md animate-in fade-in zoom-in duration-300">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-14 text-[16px] font-semibold rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all bg-primary hover:bg-primary/90" 
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            {t('register_button')}
          </Button>
        </form>
      </main>

      <footer className="mt-auto pt-8 pb-4 text-center text-[14px] relative z-10">
        <p className="text-muted-foreground/60">
          {t('have_account')}{' '}
          <Link href={`/${locale}/login`} className="text-primary hover:text-primary/80 font-bold transition-all ml-1">
            {t('login')}
          </Link>
        </p>
      </footer>
    </div>
  );
}
