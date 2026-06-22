'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeGoogleDriveCode } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

/**
 * This page handles the redirect from Google OAuth.
 * It performs the token exchange and then redirects to the music page.
 */
function GoogleCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken, isHydrated, hydrate } = useAuthStore();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
  }, [isHydrated, hydrate]);

  useEffect(() => {
    if (!isHydrated) return;

    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // Determine locale from localStorage or default to 'vi'
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
      // If we lost the session, we can't exchange the token (since it's tied to the user)
      // Redirect to login with error parameter
      router.replace(`/${locale}/login?error=session_expired`);
      return;
    }

    const exchange = async () => {
      try {
        await exchangeGoogleDriveCode(token, code, state);
        setStatus('success');
        
        // Wait a bit to show success state then go back to music
        setTimeout(() => {
          router.replace(`/${locale}/music?tab=drive&openPicker=true`);
        }, 1200);
      } catch (err: any) {
        console.error('Exchange failed:', err);
        setErrorMsg(err.message || 'Failed to exchange tokens');
        setStatus('error');
      }
    };

    exchange();
  }, [isHydrated, accessToken, searchParams, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 bg-card border border-border rounded-[2.5rem] shadow-xl">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold tracking-tight">Kết nối Google Drive</h1>
            <p className="text-muted-foreground text-sm mt-2">Vui lòng đợi trong giây lát...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold tracking-tight">Thành công!</h1>
            <p className="text-muted-foreground text-sm mt-2">Đã kết nối Drive. Đang quay lại thư viện...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold tracking-tight">Lỗi kết nối</h1>
            <p className="text-red-400 text-sm mt-2 font-medium">{errorMsg}</p>
            <button 
              onClick={() => {
                let locale = 'vi';
                if (typeof window !== 'undefined') locale = localStorage.getItem('NEXT_LOCALE') || 'vi';
                router.replace(`/${locale}/music?tab=drive`);
              }}
              className="mt-8 w-full bg-foreground text-background py-3 rounded-2xl font-bold hover:opacity-90 transition-all"
            >
              Quay lại trang Nhạc
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function GoogleCallbackBridge() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    }>
      <GoogleCallbackHandler />
    </Suspense>
  );
}
