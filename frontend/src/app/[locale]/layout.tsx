import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { PlayerBar } from '@/components/molecules/PlayerBar';
import { BottomTabBar } from '@/components/molecules/Navigation/BottomTabBar';
import { AuthGate } from '@/components/auth/AuthGate';
import { NavWrapper } from '@/components/auth/NavWrapper';

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
        <div className="mx-auto max-w-[430px] min-h-[100dvh] relative pb-32">
          {children}
          <NavWrapper>
            <PlayerBar />
            <BottomTabBar />
          </NavWrapper>
        </div>
      </AuthGate>
    </NextIntlClientProvider>
  );
}
