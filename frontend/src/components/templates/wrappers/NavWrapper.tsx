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

  const isPublicRoute =
    pathname === `/${locale}/login` || pathname === `/${locale}/register`;

  if (isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}
