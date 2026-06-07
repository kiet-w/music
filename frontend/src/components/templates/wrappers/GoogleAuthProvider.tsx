'use client';

import type { ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

type GoogleAuthProviderProps = {
  children: ReactNode;
};

export function GoogleAuthProvider({ children }: GoogleAuthProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    if (typeof window !== 'undefined') {
      console.warn('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not defined');
    }

    return <>{children}</>;
  }

  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
