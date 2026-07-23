'use client';

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
  ChevronUp,
  ChevronDown,
  Trash2,
  GripVertical,
  X,
} from 'lucide-react';
import { usePlayerStore, Track } from '@/store/usePlayerStore';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// ponytail: granular selectors — PlayerBar re-renders only on specific value changes
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
const usePlay = () => usePlayerStore((s) => s.play);
const useMoveQueueTrack = () => usePlayerStore((s) => s.moveQueueTrack);
const useRemoveFromQueue = () => usePlayerStore((s) => s.removeFromQueue);

// ponytail: 3D Stacked Cards Music Deck Player Bar (AWWWARDS-level Stacked Card Layout & Reorder Queue)
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
  const play = usePlay();
  const moveQueueTrack = useMoveQueueTrack();
  const removeFromQueue = useRemoveFromQueue();

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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[420px] z-40">
      {/* --- EXPANDED 3D STACKED CARDS QUEUE DRAWER --- */}
      <AnimatePresence>
        {isStackExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="mb-3 w-full bg-zinc-950/95 border border-white/15 backdrop-blur-2xl rounded-[2.5rem] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-white overflow-hidden max-h-[380px] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold tracking-tight font-instrument">
                  Sắp xếp thứ tự nghe ({queue.length} bài)
                </h3>
              </div>
              <button
                onClick={() => setIsStackExpanded(false)}
                className="p-1 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reorderable Stack Cards List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-0.5 scrollbar-hide">
              {queue.map((track, idx) => {
                const isActive = track.id === currentTrack.id;
                return (
                  <motion.div
                    key={track.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-2xl transition-all border",
                      isActive
                        ? "bg-white text-zinc-950 border-white shadow-lg"
                        : "bg-zinc-900/80 text-white border-white/5 hover:border-white/20"
                    )}
                  >
                    {/* Track Info */}
                    <div
                      onClick={() => play(track)}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <span className={cn("text-xs font-bold w-5 text-center font-mono", isActive ? "text-zinc-950" : "text-zinc-500")}>
                        {idx + 1}
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-black/20 overflow-hidden shrink-0 border border-white/10">
                        {track.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[7px] font-bold">ART</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-xs font-bold truncate font-instrument", isActive ? "text-zinc-950" : "text-white")}>
                          {track.title}
                        </p>
                        <p className={cn("text-[11px] truncate font-medium", isActive ? "text-zinc-700" : "text-zinc-400")}>
                          {track.artist || 'Nghệ sĩ'}
                        </p>
                      </div>
                    </div>

                    {/* Reorder Buttons (Move Up / Down) */}
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => moveQueueTrack(idx, idx - 1)}
                        disabled={idx === 0}
                        className={cn(
                          "p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-20",
                          isActive ? "hover:bg-zinc-200 text-zinc-950" : "hover:bg-white/10 text-zinc-400 hover:text-white"
                        )}
                        title="Chuyển lên"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveQueueTrack(idx, idx + 1)}
                        disabled={idx === queue.length - 1}
                        className={cn(
                          "p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-20",
                          isActive ? "hover:bg-zinc-200 text-zinc-950" : "hover:bg-white/10 text-zinc-400 hover:text-white"
                        )}
                        title="Chuyển xuống"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFromQueue(track.id)}
                        className={cn(
                          "p-1 rounded-lg transition-colors cursor-pointer ml-1",
                          isActive ? "hover:bg-rose-100 text-rose-600" : "hover:bg-rose-500/20 text-rose-400"
                        )}
                        title="Xóa khỏi danh sách"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 3D STACKED CARDS MASTER PLAYER DECK --- */}
      <div className="relative w-full">
        {/* Layer 2 Card (Next Up Card in Stacked Deck) */}
        {upcomingTracks.length > 0 && (
          <div
            onClick={() => setIsStackExpanded(true)}
            className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-[92%] h-12 rounded-[2rem] bg-zinc-900/90 border border-white/10 shadow-lg z-10 cursor-pointer flex items-center justify-between px-4 text-xs text-zinc-400 opacity-80 hover:opacity-100 transition-all"
            title="Nhấp để xem và sắp xếp danh sách nghe"
          >
            <span className="truncate max-w-[200px] text-[11px]">Kế tiếp: {upcomingTracks[0].title}</span>
            <Layers size={14} />
          </div>
        )}

        {/* Layer 3 Card (Deepest Stacked Card) */}
        {upcomingTracks.length > 1 && (
          <div
            onClick={() => setIsStackExpanded(true)}
            className="absolute -top-5 left-1/2 -translate-x-1/2 w-[84%] h-10 rounded-[1.8rem] bg-zinc-950/80 border border-white/5 shadow-md z-0 cursor-pointer opacity-50 transition-all"
          />
        )}

        {/* Layer 1 Frontmaster Card (Active Track Player) */}
        <div className="relative z-30 w-full bg-zinc-950/95 border border-white/15 backdrop-blur-2xl rounded-[2.5rem] flex flex-col p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] transition-all duration-300">
          <div className="flex items-center w-full gap-3">
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
                <p className="text-xs text-zinc-400 font-medium truncate">{currentTrack.artist || 'Nghệ sĩ'}</p>
              </div>
            </div>

            {/* Audio & Stack Queue Controls */}
            <div className="flex items-center gap-1.5">
              {/* Stacked Cards Queue Reorder Toggle Button */}
              <button
                onClick={() => setIsStackExpanded((prev) => !prev)}
                className={cn(
                  "p-2 rounded-xl border transition-all active:scale-95 cursor-pointer mr-1",
                  isStackExpanded
                    ? "bg-white text-zinc-950 border-white shadow-md"
                    : "bg-white/5 text-zinc-400 hover:text-white border-white/10 hover:bg-white/10"
                )}
                title="Mở Stacked Cards / Sắp xếp thứ tự bài hát"
                aria-label="Sắp xếp danh sách phát"
              >
                <Layers size={18} strokeWidth={2} />
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
      </div>
    </div>
  );
}
