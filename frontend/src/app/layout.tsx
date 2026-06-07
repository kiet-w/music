import './globals.css';
import { Instrument_Serif } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import Script from 'next/script';

const instrumentSerif = Instrument_Serif({ 
  weight: '400',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-instrument',
  adjustFontFallback: false,
});

export const metadata = {
  title: 'Music App',
  description: 'Personal music player and downloader',
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
      </body>
    </html>
  );
}
