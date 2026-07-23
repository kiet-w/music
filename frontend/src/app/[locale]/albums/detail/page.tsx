import { AlbumDetailPage } from '@/components/pages/AlbumDetailPage';
import { Suspense } from 'react';
import { GlobalLoading } from '@/components/atoms/GlobalLoading';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <Suspense fallback={<GlobalLoading fullScreen />}>
      <AlbumDetailPage locale={locale} />
    </Suspense>
  );
}
