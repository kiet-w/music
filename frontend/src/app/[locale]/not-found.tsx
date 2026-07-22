'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Home, ArrowLeft, AlertTriangle } from 'lucide-react';

export default function LocaleNotFound() {
  const t = useTranslations('Error');

  return (
    <div className="min-h-screen w-full bg-[#090d16] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full glass-dark border border-white/10 rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center shadow-2xl backdrop-blur-xl">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/10 text-emerald-400">
          <AlertTriangle className="w-10 h-10" />
        </div>

        <span className="text-6xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent mb-2">
          404
        </span>

        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
          {t('not_found_title')}
        </h1>

        <p className="text-xs sm:text-sm text-white/50 mb-8 leading-relaxed">
          {t('not_found_desc')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl glass-light hover:bg-white/15 text-white font-medium text-xs sm:text-sm transition-all border border-white/10 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('go_back')}
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
