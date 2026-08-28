'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalLoading } from '@/components/atoms/GlobalLoading';
import { useAuthStore } from '@/store/useAuthStore';

export default function RootPage() {
  const router = useRouter();
  const { isHydrated, accessToken, hydrate } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) {
      void hydrate();
    }
  }, [isHydrated, hydrate]);

  useEffect(() => {
    if (!isHydrated) return;

    if (accessToken) {
      router.replace('/vi/albums');
    } else {
      router.replace('/vi/login');
    }
  }, [isHydrated, accessToken, router]);

  return <GlobalLoading fullScreen />;
}
