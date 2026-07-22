'use client';

import { type ReactNode } from 'react';
import { useAuthGate } from '@/hooks/useAuthGate';

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const { isHydrated, isPublicRoute } = useAuthGate();

  if (!isHydrated) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (isPublicRoute) {
    return <div className="min-h-[100dvh]">{children}</div>;
  }

  return <div className="relative min-h-[100dvh] bg-background">{children}</div>;
}

