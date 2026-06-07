'use client';

import { useEffect, type ReactNode } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';

import { useAuthStore } from '@/store/useAuthStore';

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const { isHydrated, accessToken, hydrate } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const locale = typeof params?.locale === 'string' ? params.locale : 'en';

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const isPublicRoute =
    pathname === `/${locale}/login` || pathname === `/${locale}/register`;

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

  if (!isHydrated) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (isPublicRoute) {
    return <div className="min-h-[100dvh]">{children}</div>;
  }

  return <div className="relative min-h-[100dvh] bg-background">{children}</div>;
}
