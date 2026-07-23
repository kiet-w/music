import InviteLegacyPage from '@/components/pages/InviteLegacyPage';
import { Suspense } from 'react';
import { GlobalLoading } from '@/components/atoms/GlobalLoading';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'vi' }];
}

export default function Page() {
  return (
    <Suspense fallback={<GlobalLoading fullScreen />}>
      <InviteLegacyPage />
    </Suspense>
  );
}
