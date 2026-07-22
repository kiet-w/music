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
    if (!isHydrated) {
      void hydrate();
    }
  }, [isHydrated, hydrate]);

  const cleanPath = pathname ? pathname.replace(/^\/(en|vi)/, '') : '';

  const isPublicRoute =
    pathname === '/' ||
    pathname === '/index.html' ||
    cleanPath === '' ||
    cleanPath === '/' ||
    cleanPath === '/login' ||
    cleanPath === '/register' ||
    cleanPath === '/forgot-password' ||
    cleanPath === '/password-reset' ||
    cleanPath.startsWith('/invite') ||
    cleanPath.startsWith('/auth/callback') ||
    Boolean(pathname?.includes('/login')) ||
    Boolean(pathname?.includes('/register')) ||
    Boolean(pathname?.includes('/forgot-password')) ||
    Boolean(pathname?.includes('/password-reset')) ||
    Boolean(pathname?.includes('/invite')) ||
    Boolean(pathname?.includes('/auth/callback'));

  useEffect(() => {
    if (!isHydrated) return;

    if (!accessToken && !isPublicRoute) {
      router.push(`/${locale}/login`);
      return;
    }

    if (accessToken && (cleanPath === '/login' || cleanPath === '/register' || cleanPath === '/forgot-password' || cleanPath === '/password-reset')) {
      router.push(`/${locale}/albums`);
    }
  }, [accessToken, isHydrated, isPublicRoute, locale, pathname, cleanPath, router]);

  return {
    isHydrated,
    isPublicRoute,
    accessToken,
    locale,
  };
}
