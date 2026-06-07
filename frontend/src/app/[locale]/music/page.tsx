import { Suspense } from 'react';
import { MusicPage } from '@/components/pages/MusicPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center animate-pulse">Loading...</div>}>
      <MusicPage />
    </Suspense>
  );
}
