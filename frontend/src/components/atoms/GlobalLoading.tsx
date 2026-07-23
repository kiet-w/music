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
          ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md transition-opacity duration-300"
          : "flex flex-col items-center justify-center min-h-[60vh] w-full gap-4 p-6"
      }
    >
      <div className="relative flex items-center justify-center">
        {/* Glow backdrop pulse */}
        <div className="absolute w-12 h-12 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
        
        {/* Modern Spinner */}
        <Loader2 className="w-9 h-9 text-emerald-400 animate-spin relative z-10 stroke-[2]" />
      </div>

      {message && (
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
