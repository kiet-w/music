import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import { AuthGate } from '@/components/templates/wrappers/AuthGate';
import { NavWrapper } from '@/components/templates/wrappers/NavWrapper';
import { GoogleAuthProvider } from '@/components/templates/wrappers/GoogleAuthProvider';
import { ChatProvider } from '@/components/templates/wrappers/ChatProvider';
import { ClientShell } from '@/components/templates/wrappers/ClientShell';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'vi' }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <GoogleAuthProvider>
        <ChatProvider>
          <AuthGate>
            {children}
            <NavWrapper>
              <ClientShell />
            </NavWrapper>
          </AuthGate>
        </ChatProvider>
      </GoogleAuthProvider>
    </NextIntlClientProvider>
  );
}
