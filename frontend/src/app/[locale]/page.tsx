'use client';

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalLoading } from '@/components/atoms/GlobalLoading';

export default function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${locale || 'vi'}/albums`);
  }, [locale, router]);

  return <GlobalLoading fullScreen />;
}
