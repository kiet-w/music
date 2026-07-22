import { Suspense } from 'react';
import { LoginPage } from '@/components/pages/LoginPage';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
      <LoginPage locale={locale} />
    </Suspense>
  );
}
