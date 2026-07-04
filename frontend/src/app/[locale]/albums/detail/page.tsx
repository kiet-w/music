import { AlbumDetailPage } from '@/components/pages/AlbumDetailPage';
import { Suspense } from 'react';

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-center animate-pulse">Loading...</div>}>
      <AlbumDetailPage locale={locale} />
    </Suspense>
  );
}
