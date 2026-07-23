'use client';

import React from 'react';
import { Reorder, AnimatePresence } from 'framer-motion';
import { Play, Pause, Layers, X, Volume2, Trash2 } from 'lucide-react';
import { usePlayerStore, Track } from '@/store/usePlayerStore';
import { cn } from '@/lib/utils';
import { optimizedDragConfig } from '@/hooks/useOptimizedAnimation';

interface StackedFanDeckProps {
  isOpen?: boolean;
  onClose: () => void;
}

// 6-dot grid icon for drag handle
function DotGrid({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" className={className}>
      <circle cx="4" cy="4" r="1.8" fill="currentColor" />
      <circle cx="9" cy="4" r="1.8" fill="currentColor" />
      <circle cx="14" cy="4" r="1.8" fill="currentColor" />
      <circle cx="4" cy="9" r="1.8" fill="currentColor" />
      <circle cx="9" cy="9" r="1.8" fill="currentColor" />
      <circle cx="14" cy="9" r="1.8" fill="currentColor" />
      <circle cx="4" cy="14" r="1.8" fill="currentColor" />
      <circle cx="9" cy="14" r="1.8" fill="currentColor" />
      <circle cx="14" cy="14" r="1.8" fill="currentColor" />
    </svg>
  );
}

export function StackedFanDeck({ isOpen = true, onClose }: StackedFanDeckProps) {
  const { queue, currentTrack, isPlaying, play, togglePlay, reorderQueue, removeFromQueue } = usePlayerStore();

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || queue.length === 0) return null;

  const handleCardClick = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      play(track);
    }
  };

  return (
    <div className="w-[360px] sm:w-[380px] max-w-[90vw] rounded-[2rem] bg-zinc-950/95 border border-white/15 backdrop-blur-2xl p-4 flex flex-col text-white shrink-0 shadow-[0_25px_60px_rgba(0,0,0,0.9)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-1 border-b border-white/10 shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center border border-white/15">
            <Layers className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Danh sách chờ</h3>
            <p className="text-[11px] text-zinc-400 font-mono">{queue.length} bài hát trong hàng chờ</p>
          </div>
        </div>
      </div>

      {/* Queue Items List — Hardware-Accelerated 120fps Reorder */}
      <div className="max-h-[380px] overflow-y-auto custom-scrollbar pr-1 pt-1">
        <Reorder.Group 
          axis="y" 
          values={queue} 
          onReorder={reorderQueue}
          className="space-y-2 relative"
        >
          <AnimatePresence initial={false}>
            {queue.map((track) => {
              const isCurrent = currentTrack?.id === track.id;

              return (
                <Reorder.Item
                  key={track.id}
                  value={track}
                  transition={optimizedDragConfig.transition}
                  whileDrag={optimizedDragConfig.whileDrag}
                  className={cn(
                    "group relative h-16 rounded-2xl px-3 flex items-center gap-3 border select-none will-change-transform transform-gpu cursor-grab active:cursor-grabbing",
                    isCurrent
                      ? "bg-white text-zinc-950 border-white shadow-xl ring-2 ring-white/80"
                      : "bg-zinc-900/90 hover:bg-zinc-800 text-white border-white/10 hover:border-white/20 shadow-md"
                  )}
                >
                  {/* Play/Pause Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(track);
                    }}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-transform active:scale-95",
                      isCurrent
                        ? "bg-zinc-950 text-white shadow-md"
                        : "bg-white/10 text-white hover:bg-white/20"
                    )}
                    title={isCurrent && isPlaying ? "Tạm dừng" : "Phát nhạc"}
                  >
                    {isCurrent && isPlaying ? (
                      <Pause size={16} fill="currentColor" />
                    ) : (
                      <Play size={16} fill="currentColor" className="ml-0.5" />
                    )}
                  </button>

                  {/* Song Information — 100% Clear & Readable */}
                  <div 
                    onClick={() => handleCardClick(track)}
                    className="min-w-0 flex-1 py-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <p className={cn("text-xs sm:text-sm font-bold truncate leading-tight", isCurrent ? "text-zinc-950" : "text-white")}>
                        {track.title}
                      </p>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-zinc-950 bg-zinc-200 px-2 py-0.5 rounded-full shrink-0 border border-zinc-300">
                          <Volume2 size={10} className="animate-pulse" />
                          {isPlaying ? 'Đang phát' : 'Đang chọn'}
                        </span>
                      )}
                    </div>
                    <p className={cn("text-[11px] truncate mt-0.5 font-medium", isCurrent ? "text-zinc-600" : "text-zinc-400")}>
                      {track.artist || 'Nghệ sĩ'}
                    </p>
                  </div>

                  {/* Actions: Remove & Drag Reorder Handle */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(track.id);
                      }}
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer",
                        isCurrent
                          ? "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-200"
                          : "text-zinc-500 hover:text-rose-400 hover:bg-white/10"
                      )}
                      title="Xóa khỏi hàng chờ"
                    >
                      <Trash2 size={14} />
                    </button>

                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 touch-none",
                        isCurrent
                          ? "text-zinc-400 hover:text-zinc-800"
                          : "text-zinc-600 hover:text-zinc-300"
                      )}
                      title="Giữ để kéo"
                    >
                      <DotGrid />
                    </div>
                  </div>
                </Reorder.Item>
              );
            })}
          </AnimatePresence>
        </Reorder.Group>
      </div>
    </div>
  );
}

export default StackedFanDeck;
