'use client';

import { useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export function useAuthGate() {
  const { isHydrated, accessToken, hydrate } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params?.locale === 'string' ? params.locale : 'en';

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const isPublicRoute =
    pathname === `/${locale}/login` ||
    pathname === `/${locale}/register` ||
    pathname === `/${locale}/forgot-password` ||
    pathname.startsWith(`/${locale}/invite`) ||
    pathname === `/${locale}/auth/callback/google` ||
    pathname === '/auth/callback/google' ||
    pathname.includes('/auth/callback');

  useEffect(() => {
    if (!isHydrated) return;

    if (!accessToken && !isPublicRoute) {
      router.push(`/${locale}/login`);
      return;
    }

    if (accessToken && isPublicRoute) {
      router.push(`/${locale}`);
    }
  }, [accessToken, isHydrated, isPublicRoute, locale, router]);

  return {
    isHydrated,
    isPublicRoute,
    accessToken,
    locale,
  };
}
