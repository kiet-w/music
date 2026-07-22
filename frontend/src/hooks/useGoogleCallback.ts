'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeGoogleDriveCode } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export function useGoogleCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken, isHydrated, hydrate } = useAuthStore();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isHydrated) {
      void hydrate();
    }
  }, [isHydrated, hydrate]);

  useEffect(() => {
    if (!isHydrated) return;

    const code = searchParams.get('code');
    const state = searchParams.get('state');

    let locale = 'vi';
    if (typeof window !== 'undefined') {
      locale = localStorage.getItem('NEXT_LOCALE') || 'vi';
    }

    if (!code || !state) {
      setErrorMsg('Missing code or state from Google.');
      setStatus('error');
      return;
    }

    const token = typeof accessToken === 'string' ? accessToken.trim() : '';
    if (!token) {
      router.replace(`/${locale}/login?error=session_expired`);
      return;
    }

    const exchange = async () => {
      try {
        await exchangeGoogleDriveCode(token, code, state);
        setStatus('success');

        setTimeout(() => {
          router.replace(`/${locale}/music?tab=drive&openPicker=true`);
        }, 1200);
      } catch (err: any) {
        console.error('Exchange failed:', err);
        setErrorMsg(err.message || 'Failed to exchange tokens');
        setStatus('error');
      }
    };

    void exchange();
  }, [isHydrated, accessToken, searchParams, router]);

  const handleBackToMusic = () => {
    let locale = 'vi';
    if (typeof window !== 'undefined') locale = localStorage.getItem('NEXT_LOCALE') || 'vi';
    router.replace(`/${locale}/music?tab=drive`);
  };

  return {
    status,
    errorMsg,
    handleBackToMusic,
  };
}
