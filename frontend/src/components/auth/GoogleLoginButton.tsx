'use client';

import React, { useState } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuthStore } from '@/store/useAuthStore';
import { googleLogin } from '@/lib/api';
import { useTranslations } from 'next-intl';

export function GoogleLoginButton() {
  const t = useTranslations('Auth');
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('No credential received');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await googleLogin(credentialResponse.credential);
      setSession(response.accessToken, response.user);
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = () => {
    setError('Google login failed');
  };

  return (
    <div className="flex flex-col items-center w-full gap-2">
      <div className="w-full flex justify-center">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          useOneTap
          theme="filled_black"
          shape="pill"
          width="100%"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {isLoading && <p className="text-sm text-muted-foreground italic">Signing in...</p>}
    </div>
  );
}
