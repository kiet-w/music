'use client';

import type { ReactNode } from 'react';
import { useParams, usePathname } from 'next/navigation';

type NavWrapperProps = {
  children: ReactNode;
};

export function NavWrapper({ children }: NavWrapperProps) {
  const pathname = usePathname();
  const params = useParams();
  const locale = typeof params?.locale === 'string' ? params.locale : 'en';

  const cleanPath = pathname ? pathname.replace(/^\/(en|vi)/, '') : '';
  const isPublicRoute =
    cleanPath === '/login' ||
    cleanPath === '/register' ||
    cleanPath === '/forgot-password' ||
    cleanPath === '/password-reset' ||
    cleanPath.startsWith('/invite') ||
    cleanPath.startsWith('/auth/callback') ||
    Boolean(pathname?.includes('/login')) ||
    Boolean(pathname?.includes('/register')) ||
    Boolean(pathname?.includes('/password-reset')) ||
    Boolean(pathname?.includes('/forgot-password'));

  if (isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}
