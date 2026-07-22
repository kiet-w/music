import './globals.css';
import { Instrument_Serif } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
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
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  interactiveWidget: 'overlays-content',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-background dark" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${instrumentSerif.variable} font-sans bg-background text-foreground antialiased selection:bg-foreground selection:text-background`} suppressHydrationWarning>
        {children}
        <Toaster richColors position="top-center" theme="dark" closeButton />
      </body>
    </html>
  );
}
