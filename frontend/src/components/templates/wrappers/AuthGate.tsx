'use client';

import { type ReactNode } from 'react';
import { useAuthGate } from '@/hooks/useAuthGate';

import { GlobalLoading } from '@/components/atoms/GlobalLoading';

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const { isHydrated, isPublicRoute, accessToken } = useAuthGate();

  if (!isHydrated) {
    return <GlobalLoading fullScreen />;
  }

  if (!isPublicRoute && !accessToken) {
    return <GlobalLoading fullScreen />;
  }

  if (isPublicRoute) {
    return <div className="min-h-[100dvh]">{children}</div>;
  }

  return <div className="relative min-h-[100dvh] bg-background">{children}</div>;
}

