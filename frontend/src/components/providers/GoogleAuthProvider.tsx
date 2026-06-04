'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import React from 'react';

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    if (typeof window !== 'undefined') {
      console.warn('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not defined');
    }
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
