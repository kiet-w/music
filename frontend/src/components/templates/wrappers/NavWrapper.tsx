'use client';

import type { ReactNode } from 'react';
import { useParams, usePathname } from 'next/navigation';

type NavWrapperProps = {
  children: ReactNode;
};

// ponytail: optimized public route detection to bypass navigation shell on authentication screens
export function NavWrapper({ children }: NavWrapperProps) {
  const pathname = usePathname();

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
