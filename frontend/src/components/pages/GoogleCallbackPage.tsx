'use client';

import { Suspense } from 'react';
import { CallbackStatusCard } from '@/components/molecules/Auth/CallbackStatusCard';
import { Loader2 } from 'lucide-react';
import { useGoogleCallback } from '@/hooks/useGoogleCallback';

/**
 * This page handles the redirect from Google OAuth.
 * It performs the token exchange and then redirects to the music page.
 */
// ponytail: unified google callback page view with design.md tokens
function GoogleCallbackHandler() {
  const { status, errorMsg, handleBackToMusic } = useGoogleCallback();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <CallbackStatusCard
        status={status}
        errorMsg={errorMsg}
        onBackToMusic={handleBackToMusic}
      />
    </div>
  );
}

export function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-foreground animate-spin" />
      </div>
    }>
      <GoogleCallbackHandler />
    </Suspense>
  );
}

export default GoogleCallbackPage;

