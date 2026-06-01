import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import dynamic from 'next/dynamic';
import { AuthGate } from '@/components/auth/AuthGate';
import { NavWrapper } from '@/components/auth/NavWrapper';

const PlayerBar = dynamic(() => import('@/components/molecules/PlayerBar'), {
  ssr: false
});

const BottomTabBar = dynamic(() => import('@/components/molecules/Navigation/BottomTabBar'), {
  ssr: false
});

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'vi' }];
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AuthGate>
        {children}
        <NavWrapper>
          <PlayerBar />
          <BottomTabBar />
        </NavWrapper>
      </AuthGate>
    </NextIntlClientProvider>
  );
}
