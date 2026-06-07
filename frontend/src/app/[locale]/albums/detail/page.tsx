import { Suspense } from 'react';
import { AlbumDetailPage } from '@/components/pages/AlbumDetailPage';

export default function Page({ 
  params: { locale }
}: { 
  params: { locale: string }
}) {
  return (
    <Suspense fallback={<div className="p-8 text-center animate-pulse">Loading...</div>}>
      <AlbumDetailPage locale={locale} />
    </Suspense>
  );
}
