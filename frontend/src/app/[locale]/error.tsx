'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { RefreshCw, Home, AlertOctagon } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('Error');

  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-[#090d16] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full glass-dark border border-white/10 rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center shadow-2xl backdrop-blur-xl">
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 shadow-lg shadow-red-500/10 text-red-400">
          <AlertOctagon className="w-10 h-10" />
        </div>

        <span className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-red-400 via-rose-300 to-amber-400 bg-clip-text text-transparent mb-2">
          {t('error_title')}
        </span>

        <h1 className="text-lg sm:text-xl font-bold text-white mb-2">
          {t('error_subtitle')}
        </h1>

        <p className="text-xs sm:text-sm text-white/50 mb-8 leading-relaxed">
          {error?.message || t('error_desc_default')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl glass-light hover:bg-white/15 text-white font-medium text-xs sm:text-sm transition-all border border-white/10 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            {t('try_again')}
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Home className="w-4 h-4" />
            {t('go_home')}
          </Link>
        </div>
      </div>
    </div>
  );
}
