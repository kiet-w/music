'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Pause, Sparkles, Disc, Radio, Volume2 } from 'lucide-react';
import { PlayTrackItem } from './types';
import { optimizedMotionVariants } from '@/hooks/useOptimizedAnimation';

interface HomeHeroSectionProps {
  locale: string;
  featuredTrack: PlayTrackItem;
  isPlaying: boolean;
  onPlayTrack: (track: PlayTrackItem) => void;
}

export function HomeHeroSection({ 
  locale, 
  featuredTrack, 
  isPlaying, 
  onPlayTrack 
}: HomeHeroSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-zinc-950 border border-white/10 p-6 md:p-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_25px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
      {/* Subtle Studio Monochrome Ambient Light */}
      <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        {/* Asymmetric Left Content (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Studio Release Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/15 text-white/90 text-xs font-mono tracking-wider uppercase backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <Sparkles size={13} className="animate-pulse text-white" />
            <span>Nổi Bật Hôm Nay</span>
          </div>

          {/* Instrument Typography Title */}
          <h2 className="font-instrument text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-tighter text-white leading-[1.04]">
            Khám phá âm thanh <span className="italic font-instrument text-white/90">thuần khiết</span> từ Studio
          </h2>

          {/* Body Paragraph */}
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-xl font-sans">
            Trải nghiệm những bản thu chất lượng cao nhất với hệ thống xử lý âm thanh độc quyền. Tạo bộ sưu tập riêng và thưởng thức âm nhạc không giới hạn.
          </p>

          {/* Action CTAs with Tactile Feedback */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button 
              onClick={() => onPlayTrack(featuredTrack)}
              className="flex items-center gap-3 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-full shadow-xl shadow-white/5 border border-white/20 active:scale-[0.97] transition-all duration-200 cursor-pointer"
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              <span>{isPlaying ? 'Đang phát' : 'Nghe ngay'}</span>
            </button>

            <Link 
              href={`/${locale}/albums`}
              className="flex items-center gap-2 bg-white/[0.05] hover:bg-white/10 text-white font-medium text-xs uppercase tracking-wider px-5 py-3.5 rounded-full border border-white/15 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] active:scale-[0.97] transition-all duration-200 cursor-pointer"
            >
              <Disc size={16} />
              <span>Bộ sưu tập Album</span>
            </Link>
          </div>

          {/* Studio Tech Stats Bar */}
          <div className="pt-4 border-t border-white/10 flex items-center gap-6 text-[11px] font-mono text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Radio size={12} className="text-zinc-400" />
              <span>STUDIO DIRECT</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Volume2 size={12} className="text-zinc-400" />
              <span>MASTER QUALITY</span>
            </div>
          </div>
        </div>

        {/* Asymmetric Right Featured Track Card (5 columns) */}
        <div className="lg:col-span-5">
          <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5 shadow-2xl shadow-black/80 backdrop-blur-2xl relative group hover:border-white/20 transition-all duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            {/* Image Container with Glass Overlay */}
            <div className="relative aspect-video rounded-xl overflow-hidden mb-4 border border-white/10 shadow-inner bg-zinc-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={featuredTrack.coverUrl || featuredTrack.cover} 
                alt={featuredTrack.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out will-change-transform transform-gpu"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent flex items-end p-4">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-white/90 bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/15 mb-2 inline-block shadow-sm">
                    Track của ngày
                  </span>
                  <h3 className="font-instrument text-2xl font-normal text-white leading-tight">
                    {featuredTrack.title}
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans mt-0.5">{featuredTrack.artist}</p>
                </div>
              </div>
            </div>

            {/* Audio Control & Equalizer Panel */}
            <div className="flex items-center gap-4 bg-zinc-950/90 p-3.5 rounded-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              {/* Mini Play Button */}
              <button 
                onClick={() => onPlayTrack(featuredTrack)}
                className="w-11 h-11 rounded-full bg-white text-zinc-950 flex items-center justify-center shrink-0 hover:bg-zinc-200 hover:scale-[1.03] active:scale-[0.95] transition-all duration-200 cursor-pointer shadow-md"
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="ml-0.5" fill="currentColor" />}
              </button>

              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center text-[11px] text-zinc-400 font-mono">
                  <span>01:15</span>
                  {/* Dynamic Studio Spectrum Equalizer Bars */}
                  <div className="flex items-center gap-0.5 h-3">
                    {[0.6, 0.9, 0.4, 1, 0.7, 0.3, 0.8, 0.5, 0.9, 0.4].map((heightRatio, i) => (
                      <span 
                        key={i} 
                        style={{ height: isPlaying ? `${heightRatio * 100}%` : '30%' }}
                        className={`w-0.5 bg-white/70 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`}
                      />
                    ))}
                  </div>
                  <span>03:45</span>
                </div>

                {/* Progress Bar with inner refraction */}
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
                  <div className={`h-full bg-white rounded-full w-1/3 ${isPlaying ? 'animate-pulse' : ''}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
