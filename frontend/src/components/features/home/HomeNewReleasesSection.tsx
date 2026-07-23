'use client';

import React, { useState } from 'react';
import { Play, MoreVertical, Disc3 } from 'lucide-react';
import { PlayTrackItem } from './types';
import { TrackMoreOptionsPopup } from '@/components/features/shared/TrackMoreOptionsPopup';

export interface NewReleaseItem {
  id: string;
  title: string;
  artist?: string | null;
  cover?: string;
  coverUrl?: string;
  url?: string;
  date?: string;
}

interface HomeNewReleasesSectionProps {
  newReleases: NewReleaseItem[];
  onPlayTrack: (item: PlayTrackItem) => void;
}

export function HomeNewReleasesSection({
  newReleases,
  onPlayTrack
}: HomeNewReleasesSectionProps) {
  const [activeMoreTrackId, setActiveMoreTrackId] = useState<string | null>(null);

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 backdrop-blur-sm shadow-sm">
            <Disc3 size={16} strokeWidth={1.75} />
          </div>
          <h2 className="font-instrument text-2xl font-medium tracking-tight text-white">Mới Phát Hành</h2>
        </div>
        <span className="text-xs text-zinc-400 font-mono tracking-wide">Cập nhật hàng ngày</span>
      </div>

      {/* New Releases Grid - Minimalist Disc Showcase without heavy card boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
        {newReleases.map((item) => {
          const displayCover = item.coverUrl || item.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80';
          const isMoreOpen = activeMoreTrackId === item.id;

          return (
            <div
              key={item.id}
              className="group relative cursor-pointer flex flex-col space-y-2.5 p-2 rounded-2xl hover:bg-white/[0.03] transition-all duration-300 active:scale-[0.98]"
            >
              {/* Cover Art / Music Disc Showcase */}
              <div
                onClick={() => onPlayTrack(item)}
                className="aspect-square rounded-2xl overflow-hidden bg-zinc-900 relative border border-white/10 shadow-md group-hover:shadow-black/60 group-hover:border-white/20 transition-all duration-300"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayCover}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />

                {/* Floating Top Badge & Options Menu */}
                <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
                  <span className="pointer-events-auto backdrop-blur-md bg-white/90 text-black text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full border border-white/20 shadow-sm uppercase">
                    Mới
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMoreTrackId(isMoreOpen ? null : item.id);
                    }}
                    className="pointer-events-auto w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 border border-white/20 active:scale-90 cursor-pointer"
                    title="Tùy chọn khác (...)"
                  >
                    <MoreVertical size={14} strokeWidth={1.75} />
                  </button>
                </div>

                {/* Center Play Button Overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform group-hover:scale-100 scale-90 transition-transform duration-300 active:scale-90">
                    <Play size={16} strokeWidth={2} fill="currentColor" className="ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Clean Typography using Negative Space */}
              <div onClick={() => onPlayTrack(item)} className="min-w-0 px-0.5">
                <h3 className="font-medium text-sm text-white group-hover:text-amber-200/90 transition-colors truncate leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-400 truncate mt-0.5">{item.artist || 'Nghệ sĩ'}</p>
                {item.date && (
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">{item.date}</p>
                )}
              </div>

              {/* Popup Menu */}
              <TrackMoreOptionsPopup
                track={item}
                isOpen={isMoreOpen}
                onClose={() => setActiveMoreTrackId(null)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

