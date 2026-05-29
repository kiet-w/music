import Script from 'next/script';
import '../globals.css';
import { Instrument_Serif } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { PlayerBar } from '@/components/molecules/Player/PlayerBar';
import { BottomTabBar } from '@/components/molecules/Navigation/BottomTabBar';
import { UpdaterInit } from '@/components/UpdaterInit';

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
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self' data: gap: https://ssl.gstatic.com 'unsafe-eval'; script-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/client; connect-src 'self' http://localhost:3002 http://192.168.1.16:3002 https://ukpsubptfzmuszcnnjoy.supabase.co https://accounts.google.com/gsi/; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; frame-src https://accounts.google.com/gsi/;" />
      </head>
      <body className={`${GeistSans.variable} ${instrumentSerif.variable} font-sans bg-background text-foreground antialiased selection:bg-foreground selection:text-background`}>
        <UpdaterInit />
        <Script 
          src="https://accounts.google.com/gsi/client" 
          strategy="beforeInteractive"
        />
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
