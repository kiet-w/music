'use client';

import type { ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

type GoogleAuthProviderProps = {
  children: ReactNode;
};

export function GoogleAuthProvider({ children }: GoogleAuthProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform();

  if (!clientId || isNative) {
    if (typeof window !== 'undefined' && !isNative) {
      console.warn('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not defined');
    }

    return <>{children}</>;
  }

  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
