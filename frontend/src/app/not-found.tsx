'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft, AlertCircle } from 'lucide-react';

export default function GlobalNotFound() {
  return (
    <div className="min-h-screen w-full bg-[#090d16] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full glass-dark border border-white/10 rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center shadow-2xl backdrop-blur-xl">
        {/* Badge Icon */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/10">
          <AlertCircle className="w-10 h-10 text-emerald-400" />
        </div>

        {/* 404 Code */}
        <span className="text-6xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent mb-2">
          404
        </span>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Trang không tồn tại
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-white/50 mb-8 leading-relaxed">
          Trang bạn đang tìm kiếm không tồn tại, đã bị xóa hoặc đường dẫn bị hỏng.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl glass-light hover:bg-white/15 text-white font-medium text-xs sm:text-sm transition-all border border-white/10 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>

          <Link
            href="/vi"
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Home className="w-4 h-4" />
            Trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
