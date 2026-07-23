'use client';

import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// ponytail: granular selectors — PlayerBar re-renders only on specific value changes
const useCurrentTrack = () => usePlayerStore((s) => s.currentTrack);
const useIsPlaying = () => usePlayerStore((s) => s.isPlaying);
const useTogglePlay = () => usePlayerStore((s) => s.togglePlay);
const useCurrentTime = () => usePlayerStore((s) => s.currentTime);
const useDuration = () => usePlayerStore((s) => s.duration);
const useSeek = () => usePlayerStore((s) => s.seek);
const useVolume = () => usePlayerStore((s) => s.volume);
const useSetVolume = () => usePlayerStore((s) => s.setVolume);

// ponytail: studio audio master deck player bar (AWWWARDS Monochromatic Design)
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
      className="fixed bottom-[96px] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[420px] bg-zinc-950/95 border border-white/15 backdrop-blur-2xl rounded-[2.5rem] flex flex-col p-4 sm:p-5 z-40 shadow-[0_20px_50px_rgba(0,0,0,0.9)] transition-all duration-300"
    >
      <div className="flex items-center w-full gap-4">
        {/* Track Cover & Details */}
        <div className="flex items-center flex-1 min-w-0 gap-3">
          <div className="w-12 h-12 bg-white/5 rounded-2xl overflow-hidden flex-shrink-0 border border-white/10 shadow-md">
            {currentTrack.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentTrack.coverUrl} alt={currentTrack.title} loading="lazy" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[8px] font-bold uppercase tracking-tighter text-white/30">
                No Art
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold font-instrument tracking-tight truncate text-white">{currentTrack.title}</p>
            <p className="text-xs text-zinc-400 font-medium truncate">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white transition-colors active:scale-90 cursor-pointer">
            <SkipBack size={18} strokeWidth={2} fill="currentColor" />
          </button>
          <button
            onClick={togglePlay}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-zinc-950 hover:scale-105 transition-all active:scale-95 shadow-[0_0_25px_rgba(255,255,255,0.4)] cursor-pointer"
          >
            {isPlaying ? (
              <Pause size={20} strokeWidth={2} fill="currentColor" />
            ) : (
              <Play size={20} strokeWidth={2} fill="currentColor" className="ml-0.5" />
            )}
          </button>
          <button className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white transition-colors active:scale-90 cursor-pointer">
            <SkipForward size={18} strokeWidth={2} fill="currentColor" />
          </button>
        </div>
      </div>

      {/* Progress Bar & Volume */}
      <div className="mt-3 px-1">
        <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden group cursor-pointer">
          <div
            className="absolute h-full bg-white transition-[width] duration-1000 ease-linear group-hover:bg-white"
            style={{ width: `${progressPct}%` }}
          />
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full cursor-pointer pointer-events-auto z-10 player-slider opacity-0"
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] font-bold text-zinc-400 tabular-nums tracking-wider uppercase font-mono">
          <span>{formatTime(currentTime)}</span>

          <div className="flex items-center gap-1.5 w-20 group">
            <button
              onClick={() => setVolume(volume === 0 ? 1 : 0)}
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {volume === 0 ? <VolumeX size={12} /> : volume < 0.5 ? <Volume1 size={12} /> : <Volume2 size={12} />}
            </button>
            <div className="relative w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-white/60 group-hover:bg-white transition-colors"
                style={{ width: `${volume * 100}%` }}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full cursor-pointer pointer-events-auto z-10 player-slider opacity-0"
              />
            </div>
          </div>

          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
