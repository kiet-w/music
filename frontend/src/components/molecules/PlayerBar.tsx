'use client';

import React from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { cn } from '@/lib/utils';

import { motion, AnimatePresence } from 'framer-motion';

export default function PlayerBar() {
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
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-[96px] left-0 right-0 mx-auto w-[calc(100%-2rem)] max-w-[390px] glass-dark shadow-soft rounded-[2rem] flex flex-col p-4 z-40 border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
    >
      <div className="flex items-center w-full gap-4">
        <div className="flex items-center flex-1 min-w-0 gap-3">
          <motion.div 
            animate={isPlaying ? {
              scale: [1, 1.05, 1],
              rotate: [0, 2, 0, -2, 0]
            } : {}}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 bg-white/5 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner border border-white/10"
          >
            {currentTrack.coverUrl ? (
              <img src={currentTrack.coverUrl} alt={currentTrack.title} loading="lazy" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[7px] font-bold uppercase tracking-tighter text-white/20">
                No Art
              </div>
            )}
          </motion.div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold truncate tracking-tight text-white">{currentTrack.title}</p>
            <p className="text-[11px] text-white/40 truncate font-medium">{currentTrack.artist}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="w-9 h-9 flex items-center justify-center text-white/30 hover:text-white transition-all active:scale-90">
            <SkipBack size={20} strokeWidth={1.5} fill="currentColor" className="opacity-80" />
          </button>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={togglePlay}
            className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <AnimatePresence mode="wait">
              {isPlaying ? (
                <motion.div
                  key="pause"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <Pause size={20} strokeWidth={1.5} fill="currentColor" />
                </motion.div>
              ) : (
                <motion.div
                  key="play"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <Play size={20} strokeWidth={1.5} fill="currentColor" className="ml-1" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
          <button className="w-9 h-9 flex items-center justify-center text-white/30 hover:text-white transition-all active:scale-90">
            <SkipForward size={20} strokeWidth={1.5} fill="currentColor" className="opacity-80" />
          </button>
        </div>
      </div>

      <div className="mt-4 px-1">
        <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="absolute h-full bg-white" 
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
          <input 
            type="range" 
            min="0" 
            max={duration || 100} 
            step="0.1"
            value={currentTime} 
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-medium text-white/20 tabular-nums tracking-widest uppercase">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </motion.div>
  );
}
