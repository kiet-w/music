'use client';

import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// ponytail: granular selectors — PlayerBar only re-renders when these specific values change
const useCurrentTrack = () => usePlayerStore((s) => s.currentTrack);
const useIsPlaying = () => usePlayerStore((s) => s.isPlaying);
const useTogglePlay = () => usePlayerStore((s) => s.togglePlay);
const useCurrentTime = () => usePlayerStore((s) => s.currentTime);
const useDuration = () => usePlayerStore((s) => s.duration);
const useSeek = () => usePlayerStore((s) => s.seek);
const useVolume = () => usePlayerStore((s) => s.volume);
const useSetVolume = () => usePlayerStore((s) => s.setVolume);

export default function PlayerBar() {
  const pathname = usePathname();
  const currentTrack = useCurrentTrack();
  const isPlaying = useIsPlaying();
  const togglePlay = useTogglePlay();
  const currentTime = useCurrentTime();
  const duration = useDuration();
  const seek = useSeek();
  const volume = useVolume();
  const setVolume = useSetVolume();

  const isMessagesPage = pathname?.includes('/messages');

  if (!currentTrack || isMessagesPage) return null;

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seek(time);
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="fixed bottom-[96px] left-0 right-0 mx-auto w-[calc(100%-2rem)] max-w-[360px] glass-dark shadow-soft rounded-[2rem] flex flex-col p-4 z-40 border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
    >
      <div className="flex items-center w-full gap-4">
        <div className="flex items-center flex-1 min-w-0 gap-3">
          {/* ponytail: removed infinite framer-motion animation — CSS is enough */}
          <div className="w-12 h-12 bg-white/5 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner border border-white/10">
            {currentTrack.coverUrl ? (
              <img src={currentTrack.coverUrl} alt={currentTrack.title} loading="lazy" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[7px] font-bold uppercase tracking-tighter text-white/20">
                No Art
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold truncate tracking-tight text-white">{currentTrack.title}</p>
            <p className="text-[11px] text-white/40 truncate font-medium">{currentTrack.artist}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="w-9 h-9 flex items-center justify-center text-white/30 hover:text-white transition-all active:scale-90">
            <SkipBack size={20} strokeWidth={1.5} fill="currentColor" className="opacity-80" />
          </button>
          <button
            onClick={togglePlay}
            className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            {isPlaying ? (
              <Pause size={20} strokeWidth={1.5} fill="currentColor" />
            ) : (
              <Play size={20} strokeWidth={1.5} fill="currentColor" className="ml-1" />
            )}
          </button>
          <button className="w-9 h-9 flex items-center justify-center text-white/30 hover:text-white transition-all active:scale-90">
            <SkipForward size={20} strokeWidth={1.5} fill="currentColor" className="opacity-80" />
          </button>
        </div>
      </div>

      <div className="mt-4 px-1">
        <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden group">
          <div
            className="absolute h-full bg-white transition-[width] duration-1000 ease-linear group-hover:bg-emerald-400"
            style={{ width: `${progressPct}%` }}
          />
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full cursor-pointer pointer-events-auto z-10 player-slider"
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] font-medium text-white/20 tabular-nums tracking-widest uppercase">
          <span>{formatTime(currentTime)}</span>

          <div className="flex items-center gap-1.5 w-20 group">
            <button
              onClick={() => setVolume(volume === 0 ? 1 : 0)}
              className="hover:text-white transition-colors"
            >
              {volume === 0 ? <VolumeX size={12} /> : volume < 0.5 ? <Volume1 size={12} /> : <Volume2 size={12} />}
            </button>
            <div className="relative w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-white/40 group-hover:bg-white transition-colors"
                style={{ width: `${volume * 100}%` }}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full cursor-pointer pointer-events-auto z-10 player-slider"
              />
            </div>
          </div>

          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
