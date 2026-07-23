'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalLoading } from '@/components/atoms/GlobalLoading';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/vi/albums');
  }, [router]);

  return <GlobalLoading fullScreen />;
}
