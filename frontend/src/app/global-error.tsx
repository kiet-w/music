'use client';

import React, { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen w-full bg-[#090d16] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none font-sans">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center shadow-2xl backdrop-blur-xl">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 shadow-lg shadow-red-500/10 text-red-400">
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <span className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-red-400 via-rose-300 to-amber-400 bg-clip-text text-transparent mb-2">
            System Error
          </span>

          <h1 className="text-lg sm:text-xl font-bold text-white mb-2">
            Something went critically wrong
          </h1>

          <p className="text-xs sm:text-sm text-white/50 mb-8 leading-relaxed">
            {process.env.NODE_ENV === 'development'
              ? error?.message || 'An unexpected error occurred. Please try refreshing.'
              : 'An unexpected system error occurred. Please try refreshing.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
            <button
              onClick={() => reset()}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm transition-all border border-white/10 active:scale-95"
            >
              Try Again
            </button>

            <button
              onClick={() => (window.location.href = '/')}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              Go to Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
