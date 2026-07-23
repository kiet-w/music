import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingPopupProps {
  isOpen: boolean;
  text?: string;
}

export function LoadingPopup({ isOpen, text = "Đang xử lý..." }: LoadingPopupProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-dark border border-white/10 rounded-3xl p-6 sm:p-8 max-w-xs w-full flex flex-col items-center justify-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
        </div>
        <p className="text-white font-semibold text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
