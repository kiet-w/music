import Script from 'next/script';
import '../globals.css';
import { Instrument_Serif } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { PlayerBar } from '@/components/molecules/PlayerBar';
import { BottomTabBar } from '@/components/molecules/Navigation/BottomTabBar';

const instrumentSerif = Instrument_Serif({ 
  weight: '400',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-instrument',
});

export const metadata = {
  title: 'Music App',
  description: 'Personal music player and downloader',
};

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'vi' }];
}

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html lang={locale} className="bg-background dark">
      <head>
      </head>
      <body className={`${GeistSans.variable} ${instrumentSerif.variable} font-sans bg-background text-foreground antialiased selection:bg-foreground selection:text-background`}>
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="mx-auto max-w-[430px] min-h-[100dvh] relative pb-32">
            {children}
            <PlayerBar />
            <BottomTabBar />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
