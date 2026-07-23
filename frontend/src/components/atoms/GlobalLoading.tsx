'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface GlobalLoadingProps {
  fullScreen?: boolean;
  message?: string;
}

export function GlobalLoading({ fullScreen = false, message }: GlobalLoadingProps) {
  return (
    <div
      className={
        fullScreen
          ? "fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200 p-4"
          : "absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4"
      }
    >
      <div className="glass-dark border border-white/10 rounded-3xl p-6 sm:p-8 max-w-xs w-full flex flex-col items-center justify-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
        <div className="relative flex items-center justify-center">
          {/* Glowing pulse backdrop */}
          <div className="absolute w-12 h-12 rounded-full bg-white/10 blur-xl animate-pulse" />
          
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center relative z-10">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        </div>

        {message && (
          <p className="text-white font-semibold text-sm leading-relaxed tracking-wide">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
