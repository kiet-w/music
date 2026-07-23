'use client';

// ponytail: 2D Hand-drawn Stacked Cards Music Deck Player Bar (matching exact user screenshot & rotate formula)
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
  Layers,
} from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { StackedFanDeck } from '@/components/features/music/player/StackedFanDeck';

const useCurrentTrack = () => usePlayerStore((s) => s.currentTrack);
const useQueue = () => usePlayerStore((s) => s.queue);
const useIsPlaying = () => usePlayerStore((s) => s.isPlaying);
const useTogglePlay = () => usePlayerStore((s) => s.togglePlay);
const useCurrentTime = () => usePlayerStore((s) => s.currentTime);
const useDuration = () => usePlayerStore((s) => s.duration);
const useSeek = () => usePlayerStore((s) => s.seek);
const useVolume = () => usePlayerStore((s) => s.volume);
const useSetVolume = () => usePlayerStore((s) => s.setVolume);
const usePlayNext = () => usePlayerStore((s) => s.playNext);
const usePlayPrevious = () => usePlayerStore((s) => s.playPrevious);

export default function PlayerBar() {
  const pathname = usePathname();
  const currentTrack = useCurrentTrack();
  const queue = useQueue();
  const isPlaying = useIsPlaying();
  const togglePlay = useTogglePlay();
  const currentTime = useCurrentTime();
  const duration = useDuration();
  const seek = useSeek();
  const volume = useVolume();
  const setVolume = useSetVolume();
  const playNext = usePlayNext();
  const playPrevious = usePlayPrevious();

  const [isStackExpanded, setIsStackExpanded] = useState(false);

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

  // Queue tracks upcoming after current track
  const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
  const upcomingTracks = currentIndex !== -1 ? queue.slice(currentIndex + 1) : queue;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[440px] z-40">
      {/* --- EXPANDED 2D HAND-DRAWN STACKED CARDS DECK --- */}
      <AnimatePresence>
        {isStackExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="mb-3 w-full"
          >
            <StackedFanDeck onClose={() => setIsStackExpanded(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 2D HAND-DRAWN STACKED CARDS PLAYER BAR --- */}
      <div className="relative w-full group">
        {/* Layer 2 Card (Card: -5deg tilt, peeking out behind top-left) */}
        {upcomingTracks.length > 0 && (
          <div
            onClick={() => setIsStackExpanded((prev) => !prev)}
            style={{ transform: 'rotate(-5deg) translateY(-10px) translateX(-6px)' }}
            className="absolute top-0 left-4 w-[92%] h-14 rounded-[2rem] bg-zinc-900/90 border border-white/10 shadow-lg z-10 cursor-pointer flex items-center justify-between px-5 text-xs text-zinc-400 opacity-80 hover:opacity-100 hover:rotate-0 hover:translate-y-[-14px] transition-all duration-300"
            title="Nhấp mở Stacked Cards Deck"
          >
            <span className="truncate max-w-[200px] text-[11px] font-medium text-zinc-300">
              Kế tiếp: {upcomingTracks[0].title}
            </span>
          </div>
        )}

        {/* Layer 3 Card (Card: +4deg tilt, peeking out behind top-right) */}
        {upcomingTracks.length > 1 && (
          <div
            onClick={() => setIsStackExpanded((prev) => !prev)}
            style={{ transform: 'rotate(4deg) translateY(-18px) translateX(8px)' }}
            className="absolute top-0 right-4 w-[86%] h-12 rounded-[1.8rem] bg-zinc-950/80 border border-white/10 shadow-md z-0 cursor-pointer opacity-60 hover:opacity-90 hover:rotate-0 transition-all duration-300"
          />
        )}

        {/* Layer 1 Frontmaster Player Card (Exact layout matching screenshot) */}
        <div className="relative z-30 w-full bg-zinc-950/95 border border-white/15 backdrop-blur-2xl rounded-[2.5rem] flex flex-col p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] transition-all duration-300">
          <div className="flex items-center w-full gap-3">
            {/* Track Cover Art */}
            <div className="w-12 h-12 bg-white/5 rounded-2xl overflow-hidden flex-shrink-0 border border-white/10 shadow-md">
              {currentTrack.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentTrack.coverUrl} alt={currentTrack.title} loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[8px] font-bold uppercase tracking-tighter text-white/30">
                  NO ART
                </div>
              )}
            </div>

            {/* Track Title & Artist */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold font-instrument tracking-tight truncate text-white leading-snug">{currentTrack.title}</p>
              <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">{currentTrack.artist || 'Nghệ sĩ'}</p>
            </div>

            {/* Stack Queue Button & Player Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {/* White Stack Button (exact as screenshot) */}
              <button
                onClick={() => setIsStackExpanded((prev) => !prev)}
                className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center border transition-all active:scale-95 cursor-pointer shadow-md",
                  isStackExpanded
                    ? "bg-white text-zinc-950 border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                    : "bg-white text-zinc-950 hover:bg-zinc-200 border-white"
                )}
                title="Sắp xếp thứ tự phát (Stacked Cards Deck)"
                aria-label="Sắp xếp danh sách phát"
              >
                <Layers size={20} strokeWidth={2.2} />
              </button>

              <button
                onClick={playPrevious}
                className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors active:scale-90 cursor-pointer"
                title="Bài trước"
              >
                <SkipBack size={18} strokeWidth={2} fill="currentColor" />
              </button>

              <button
                onClick={togglePlay}
                className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-zinc-950 hover:scale-105 transition-all active:scale-95 shadow-[0_0_25px_rgba(255,255,255,0.4)] cursor-pointer"
                title={isPlaying ? "Tạm dừng" : "Phát nhạc"}
              >
                {isPlaying ? (
                  <Pause size={20} strokeWidth={2} fill="currentColor" />
                ) : (
                  <Play size={20} strokeWidth={2} fill="currentColor" className="ml-0.5" />
                )}
              </button>

              <button
                onClick={playNext}
                className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors active:scale-90 cursor-pointer"
                title="Bài kế tiếp"
              >
                <SkipForward size={18} strokeWidth={2} fill="currentColor" />
              </button>
            </div>
          </div>

          {/* Progress Bar & Volume Slider */}
          <div className="mt-3.5 px-1">
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
      </div>
    </div>
  );
}
