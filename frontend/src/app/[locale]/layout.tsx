import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';

import { AuthGate } from '@/components/templates/wrappers/AuthGate';
import { NavWrapper } from '@/components/templates/wrappers/NavWrapper';
import { GoogleAuthProvider } from '@/components/templates/wrappers/GoogleAuthProvider';
import { ChatProvider } from '@/components/templates/wrappers/ChatProvider';
import { ClientShell } from '@/components/templates/wrappers/ClientShell';
import { ViewportFix } from '@/components/features/shared/ViewportFix';

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
  
  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (e) {
    messages = (await import('../../messages/vi.json')).default;
  }

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <ViewportFix />
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
