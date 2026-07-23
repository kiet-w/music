'use client';

import React, { useState } from 'react';
import { Flame, Play, Pause, TrendingUp, TrendingDown, Minus, MoreVertical } from 'lucide-react';
import { ChartItem, PlayTrackItem } from './types';
import { TrackMoreOptionsPopup } from '@/components/features/shared/TrackMoreOptionsPopup';

interface HomeTopChartSectionProps {
  activeRegion: 'vn' | 'global' | 'usuk';
  setActiveRegion: (region: 'vn' | 'global' | 'usuk') => void;
  chartList: ChartItem[];
  currentTrackId?: string;
  isPlaying: boolean;
  onPlayTrack: (item: PlayTrackItem) => void;
}

export function HomeTopChartSection({
  activeRegion,
  setActiveRegion,
  chartList,
  currentTrackId,
  isPlaying,
  onPlayTrack
}: HomeTopChartSectionProps) {
  const [activeMoreTrackId, setActiveMoreTrackId] = useState<string | null>(null);

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 backdrop-blur-sm shadow-sm">
            <Flame size={18} strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="font-instrument text-2xl sm:text-3xl font-medium tracking-tight text-white">
              Bảng Xếp Hạng Thịnh Hành
            </h2>
            <p className="text-xs text-zinc-400">Top 10 ca khúc được nghe nhiều nhất tuần này</p>
          </div>
        </div>

        {/* Region Tabs */}
        <div className="inline-flex p-1 rounded-full bg-zinc-950/80 border border-white/10 backdrop-blur-md self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveRegion('vn')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
              activeRegion === 'vn'
                ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Việt Nam
          </button>
          <button
            type="button"
            onClick={() => setActiveRegion('global')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
              activeRegion === 'global'
                ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Toàn Cầu
          </button>
          <button
            type="button"
            onClick={() => setActiveRegion('usuk')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
              activeRegion === 'usuk'
                ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            US-UK
          </button>
        </div>
      </div>

      {/* Top 10 Track List - Minimalist Spacing with Border Dividers & Negative Space */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-1">
        {chartList.map((item) => {
          const isItemPlaying = currentTrackId === item.id && isPlaying;
          const isMoreOpen = activeMoreTrackId === item.id;

          return (
            <div
              key={item.id}
              className="group relative flex items-center justify-between px-3 py-2.5 rounded-xl border-b border-white/10 hover:bg-white/[0.03] transition-all duration-200 active:scale-[0.995]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Big Serif Rank Number */}
                <span
                  className={`font-instrument text-2xl sm:text-3xl font-normal w-8 text-center shrink-0 tracking-tighter ${
                    item.rank === 1
                      ? 'text-amber-400 font-medium'
                      : item.rank === 2
                      ? 'text-zinc-200'
                      : item.rank === 3
                      ? 'text-zinc-400'
                      : 'text-zinc-600'
                  }`}
                >
                  {item.rank < 10 ? `0${item.rank}` : item.rank}
                </span>

                {/* Rank Trend Indicator */}
                <div className="shrink-0 w-3.5 text-center">
                  {item.trend === 'up' && <TrendingUp size={13} strokeWidth={2} className="text-emerald-400 mx-auto" />}
                  {item.trend === 'down' && <TrendingDown size={13} strokeWidth={2} className="text-rose-400/80 mx-auto" />}
                  {item.trend === 'same' && <Minus size={13} strokeWidth={2} className="text-zinc-600 mx-auto" />}
                </div>

                {/* Cover Art with Vinyl/Disc edge styling */}
                <div
                  onClick={() => onPlayTrack(item)}
                  className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-white/10 shadow-sm cursor-pointer group-hover:border-white/20 transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.cover}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div
                    className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${
                      isItemPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isItemPlaying ? (
                      <Pause size={15} strokeWidth={1.75} fill="currentColor" className="text-white" />
                    ) : (
                      <Play size={15} strokeWidth={1.75} fill="currentColor" className="text-white ml-0.5" />
                    )}
                  </div>
                </div>

                {/* Song Meta */}
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onPlayTrack(item)}>
                  <h4 className="font-medium text-sm text-white group-hover:text-amber-200/90 transition-colors truncate leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">{item.artist}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0 pl-2 relative">
                <span className="text-xs font-mono text-zinc-500 hidden sm:inline-block mr-1">{item.duration}</span>

                <button
                  type="button"
                  onClick={() => onPlayTrack(item)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white text-zinc-300 hover:text-black flex items-center justify-center transition-all duration-200 active:scale-90 border border-white/10 hover:border-white cursor-pointer"
                  title="Phát bài hát"
                >
                  {isItemPlaying ? (
                    <Pause size={13} strokeWidth={2} fill="currentColor" />
                  ) : (
                    <Play size={13} strokeWidth={2} fill="currentColor" className="ml-0.5" />
                  )}
                </button>

                {/* Three Dots More Options Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMoreTrackId(isMoreOpen ? null : item.id);
                  }}
                  className="w-8 h-8 rounded-full bg-transparent hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer"
                  title="Tùy chọn khác (...)"
                >
                  <MoreVertical size={15} strokeWidth={1.75} />
                </button>

                <TrackMoreOptionsPopup
                  track={item}
                  isOpen={isMoreOpen}
                  onClose={() => setActiveMoreTrackId(null)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

