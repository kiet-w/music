'use client';

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

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

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="animate-pulse font-mono text-sm text-muted-foreground">Loading...</div>
    </div>
  );
}
