import './globals.css';
import { Instrument_Serif } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import Script from 'next/script';
import { Toaster } from 'sonner';

const instrumentSerif = Instrument_Serif({ 
  weight: '400',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-instrument',
  adjustFontFallback: false,
});

import type { Viewport } from 'next';

export const metadata = {
  title: 'Music App',
  description: 'Personal music player and downloader',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-background dark">
      <body className={`${GeistSans.variable} ${instrumentSerif.variable} font-sans bg-background text-foreground antialiased selection:bg-foreground selection:text-background`}>
        <Script src="https://apis.google.com/js/api.js" strategy="beforeInteractive" />
        <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
        {children}
        <Toaster richColors position="top-right" theme="dark" closeButton />
      </body>
    </html>
  );
}
