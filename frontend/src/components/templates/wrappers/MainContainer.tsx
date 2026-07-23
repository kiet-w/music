'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface MainContainerProps {
  children: React.ReactNode;
  className?: string;
}

// ponytail: full 10-part width layout container for albums, music, user pages
export const MainContainer = ({ children, className = '' }: MainContainerProps) => {
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

  // Login & Register (and public auth pages) do NOT render top padding or main container limits
  if (isPublicRoute) {
    return (
      <div className={cn("w-full min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-background overflow-y-auto", className)}>
        {children}
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-20 md:pb-24 lg:pb-24 min-h-[100dvh] h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden">
      <main
        className={cn(
          "relative z-0 w-full flex-1 min-h-0 flex flex-col overflow-y-auto scrollbar-hide transition-all duration-300 pb-4",
          className
        )}
      >
        {children}
      </main>
    </div>
  );
};
