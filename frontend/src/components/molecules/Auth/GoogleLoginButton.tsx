'use client';

import { useState } from 'react';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import { useTranslations } from 'next-intl';

import { googleLogin } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

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
    <div className="space-y-4">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        theme="outline"
        size="large"
        text="signin_with"
        shape="pill"
        width="100%"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      {isLoading && (
        <p className="text-sm text-muted-foreground italic">{t('loading') ?? 'Signing in...'}</p>
      )}
    </div>
  );
}
