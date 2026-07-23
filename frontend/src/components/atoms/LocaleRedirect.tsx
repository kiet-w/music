'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalLoading } from '@/components/atoms/GlobalLoading';

export function LocaleRedirect({ locale }: { locale: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${locale || 'vi'}/albums`);
  }, [locale, router]);

  return <GlobalLoading fullScreen />;
}
