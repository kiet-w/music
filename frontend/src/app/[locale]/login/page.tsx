import { Suspense } from 'react';
import { LoginPage } from '@/components/pages/LoginPage';
import { GlobalLoading } from '@/components/atoms/GlobalLoading';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <Suspense fallback={<GlobalLoading fullScreen />}>
      <LoginPage locale={locale} />
    </Suspense>
  );
}
