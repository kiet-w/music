import { Suspense } from 'react';
import MessagesPage from '@/components/pages/MessagesPage';

export const dynamic = 'force-dynamic';

export default function Page({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[50vh] text-white/40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      }
    >
      <MessagesPageWrapper params={params} />
    </Suspense>
  );
}

async function MessagesPageWrapper({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <MessagesPage locale={locale} />;
}
