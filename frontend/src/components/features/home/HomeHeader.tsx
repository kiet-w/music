'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Plus } from 'lucide-react';

interface HomeHeaderProps {
  locale: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddMusicClick?: () => void;
}

export function HomeHeader({ 
  locale, 
  searchQuery, 
  setSearchQuery,
  onAddMusicClick 
}: HomeHeaderProps) {
  const handleAddMusic = () => {
    if (onAddMusicClick) {
      onAddMusicClick();
    } else {
      window.dispatchEvent(new CustomEvent('open-add-music-popup'));
    }
  };

  return (
    <header className="shrink-0 mb-4 mt-2">
      <div className="flex flex-col gap-6">
        {/* Studio Indicator Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] font-mono text-zinc-400 uppercase tracking-widest backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>Studio Audio Engine</span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
            <span>High-Res Lossless</span>
            <span className="text-white/20">•</span>
            <span>24-bit / 96kHz</span>
          </div>
        </div>

        {/* Title & Navigation Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="font-instrument text-4xl sm:text-5xl md:text-6xl tracking-tighter leading-none text-white font-normal select-none">
              Trang chủ
            </h1>
            <span className="text-white/20 text-3xl sm:text-4xl md:text-5xl font-light select-none">/</span>
            <Link 
              href={`/${locale}/albums`} 
              className="font-instrument text-4xl sm:text-5xl md:text-6xl tracking-tighter leading-none text-white/50 hover:text-white transition-colors duration-200 relative group"
            >
              Album
            </Link>
          </div>

          <p className="text-xs sm:text-sm text-zinc-400 font-sans max-w-md leading-relaxed">
            Bộ sưu tập nhạc & không gian Studio nghệ thuật đơn sắc đỉnh cao
          </p>
        </div>

        {/* Search & Actions Control Bar */}
        <div className="flex items-center justify-between gap-3">
          {/* Glassmorphic Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input 
              type="text"
              placeholder="Tìm bài hát, nghệ sĩ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-2.5 bg-white/[0.04] border border-white/10 rounded-full text-xs text-white placeholder:text-zinc-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl focus:outline-none focus:border-white/30 focus:bg-white/[0.07] focus:ring-1 focus:ring-white/20 transition-all duration-200"
            />
            <kbd className="hidden sm:inline-flex absolute right-3.5 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] font-mono text-zinc-400 pointer-events-none">
              ⌘K
            </kbd>
          </div>

          {/* Tactile Add Music CTA */}
          <button 
            onClick={handleAddMusic}
            className="flex items-center gap-2 bg-white text-zinc-950 hover:bg-zinc-200 rounded-full px-5 py-2.5 transition-all duration-200 active:scale-[0.97] text-xs font-bold uppercase tracking-wider shadow-lg shadow-white/5 border border-white/20 cursor-pointer shrink-0"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Convert / Thêm Nhạc</span>
          </button>
        </div>
      </div>
    </header>
  );
}
