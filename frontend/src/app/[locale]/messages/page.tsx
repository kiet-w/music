import { Suspense } from 'react';
import MessagesPage from '@/components/pages/MessagesPage';
import { GlobalLoading } from '@/components/atoms/GlobalLoading';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'vi' }];
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <Suspense fallback={<GlobalLoading fullScreen />}>
      <MessagesPage locale={locale} />
    </Suspense>
  );
}
