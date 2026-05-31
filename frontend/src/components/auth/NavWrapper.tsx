'use client';

import React from 'react';
import { usePathname, useParams } from 'next/navigation';

export function NavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const locale = params?.locale as string;

  const isPublicRoute = 
    pathname === `/${locale}/login` || 
    pathname === `/${locale}/register`;

  if (isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}
