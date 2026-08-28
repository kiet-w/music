'use client';

import { useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export function isPublicAuthRoute(pathname: string | null): boolean {
  const cleanPath = pathname ? pathname.replace(/^\/(en|vi)/, '') : '';

  return (
    pathname === '/' ||
    pathname === '/index.html' ||
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
    Boolean(pathname?.includes('/auth/callback'))
  );
}

export function getAuthRedirectPath({
  pathname,
  accessToken,
  isHydrated,
  locale = 'vi',
}: {
  pathname: string | null;
  accessToken: string | null;
  isHydrated: boolean;
  locale?: string;
}): string | null {
  if (!isHydrated) return null;
  const isPublicRoute = isPublicAuthRoute(pathname);
  const cleanPath = pathname ? pathname.replace(/^\/(en|vi)/, '') : '';

  if (!accessToken && !isPublicRoute) {
    return `/${locale}/login`;
  }

  if (
    accessToken &&
    (cleanPath === '/login' ||
      cleanPath === '/register' ||
      cleanPath === '/forgot-password' ||
      cleanPath === '/password-reset')
  ) {
    return `/${locale}/albums`;
  }

  return null;
}

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
  const isPublicRoute = isPublicAuthRoute(pathname);

  useEffect(() => {
    if (!isHydrated) return;

    const redirectPath = getAuthRedirectPath({
      pathname,
      accessToken,
      isHydrated,
      locale,
    });

    if (redirectPath) {
      router.push(redirectPath);
    }
  }, [accessToken, isHydrated, isPublicRoute, locale, pathname, cleanPath, router]);

  return {
    isHydrated,
    isPublicRoute,
    accessToken,
    locale,
  };
}
