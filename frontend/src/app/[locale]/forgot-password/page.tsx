import { ForgotPasswordPage } from '@/components/pages/ForgotPasswordPage';
import { Suspense } from 'react';
import { GlobalLoading } from '@/components/atoms/GlobalLoading';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'vi' }];
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <Suspense fallback={<GlobalLoading fullScreen />}>
      <ForgotPasswordPage locale={locale} />
    </Suspense>
  );
}
