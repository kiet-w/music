import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import { AuthGate } from '@/components/templates/wrappers/AuthGate';
import { NavWrapper } from '@/components/templates/wrappers/NavWrapper';
import { GoogleAuthProvider } from '@/components/templates/wrappers/GoogleAuthProvider';
import { ChatProvider } from '@/components/templates/wrappers/ChatProvider';

const PlayerBar = dynamic(() => import('@/components/molecules/PlayerBar'), {
  ssr: false,
});
const BottomTabBar = dynamic(
  () => import('@/components/molecules/Navigation/BottomTabBar'),
  { ssr: false },
);

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'vi' }];
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <GoogleAuthProvider>
        <ChatProvider>
          <AuthGate>
            {children}
            <NavWrapper>
              <PlayerBar />
              <BottomTabBar />
            </NavWrapper>
          </AuthGate>
        </ChatProvider>
      </GoogleAuthProvider>
    </NextIntlClientProvider>
  );
}
