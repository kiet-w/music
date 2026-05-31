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

  useEffect(() => {
    if (!isHydrated) return;

    // Check if the current route is public
    const isPublicRoute = 
      pathname === `/${locale}/login` || 
      pathname === `/${locale}/register`;

    if (!accessToken && !isPublicRoute) {
      // Redirect to login if protected and no token
      router.push(`/${locale}/login`);
    } else if (accessToken && isPublicRoute) {
      // Redirect to home if public and token exists
      router.push(`/${locale}`);
    }
  }, [isHydrated, accessToken, pathname, locale, router]);

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
