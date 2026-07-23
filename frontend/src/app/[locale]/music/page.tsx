import { Suspense } from 'react';
import { MusicPage } from '@/components/pages/MusicPage';
import { GlobalLoading } from '@/components/atoms/GlobalLoading';

export default function Page() {
  return (
    <Suspense fallback={<GlobalLoading fullScreen />}>
      <MusicPage />
    </Suspense>
  );
}
