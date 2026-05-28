'use client';

import React from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { cn } from '@/lib/utils';

export function PlayerBar() {
  const { currentTrack, isPlaying, togglePlay, currentTime, duration, seek } = usePlayerStore();

  if (!currentTrack) return null;

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

  return (
    <div className="fixed bottom-[96px] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] glass-dark shadow-soft rounded-2xl flex flex-col p-3 z-40 transition-all duration-300">
      <div className="flex items-center w-full px-1">
        <div className="flex items-center flex-1 min-w-0">
          <div className="w-10 h-10 bg-white/10 rounded-lg overflow-hidden flex-shrink-0 shadow-inner">
            {currentTrack.coverUrl ? (
              <img src={currentTrack.coverUrl} alt={currentTrack.title} loading="lazy" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[7px] font-bold uppercase tracking-tighter text-white/20">
                No Art
              </div>
            )}
          </div>
          <div className="ml-3 min-w-0">
            <p className="text-[13px] font-bold truncate tracking-tight">{currentTrack.title}</p>
            <p className="text-[10px] text-white/50 truncate font-medium">{currentTrack.artist}</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors active:scale-90">
            <SkipBack size={16} fill="currentColor" />
          </button>
          <button 
            onClick={togglePlay}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all shadow-glow"
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors active:scale-90">
            <SkipForward size={16} fill="currentColor" />
          </button>
        </div>
      </div>

      <div className="mt-2 px-1 space-y-1">
        <input 
          type="range" 
          min="0" 
          max={duration || 100} 
          step="1"
          value={currentTime} 
          onChange={handleSeek}
          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white hover:accent-primary transition-all"
        />
        <div className="flex justify-between text-[9px] font-medium text-white/30 tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
