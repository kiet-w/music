'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isHydrated, accessToken, hydrate } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const isPublicRoute = 
    pathname === `/${locale}/login` || 
    pathname === `/${locale}/register`;

  useEffect(() => {
    if (!isHydrated) return;

    if (!accessToken && !isPublicRoute) {
      // Redirect to login if protected and no token
      router.push(`/${locale}/login`);
    } else if (accessToken && isPublicRoute) {
      // Redirect to home if public and token exists
      router.push(`/${locale}`);
    }
  }, [isHydrated, accessToken, pathname, locale, router, isPublicRoute]);

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // If it's a public route, don't wrap in the main container with pb-32
  if (isPublicRoute) {
    return <div className="bg-background min-h-dvh">{children}</div>;
  }

  return (
    <div className="bg-background min-h-dvh relative">
      {children}
    </div>
  );
}
