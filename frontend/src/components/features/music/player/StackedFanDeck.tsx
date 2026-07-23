'use client';

// ponytail: single-layer vertical 50% half-overlapping stacked deck anchored at bottom-left position matching user hand-drawn diagram
import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Play, Pause, GripVertical, Layers, X } from 'lucide-react';
import { usePlayerStore, Track } from '@/store/usePlayerStore';
import { cn } from '@/lib/utils';

interface StackedFanDeckProps {
  isOpen?: boolean;
  onClose: () => void;
}

/*
  Half-Overlapping Straight Vertical Stack Formula (Xếp gối 1 nửa 50%):
  Card Height = 72px, Step Offset = 36px (đúng 1/2 chiều cao thẻ)
  card 1: top: 0px,   zIndex: 10
  card 2: top: 36px,  zIndex: 20
  card 3: top: 72px,  zIndex: 30
  card 4: top: 108px, zIndex: 40
  card 5: top: 144px, zIndex: 50
*/
const HALF_STACK_STEP = 36; // 50% half overlap step

export function StackedFanDeck({ isOpen = true, onClose }: StackedFanDeckProps) {
  const { queue, currentTrack, isPlaying, play, togglePlay, moveQueueTrack } = usePlayerStore();
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  if (!isOpen || queue.length === 0) return null;

  const displayQueue = queue.slice(0, 5);
  const containerHeight = Math.min(displayQueue.length * HALF_STACK_STEP + 48, 250);

  const handleCardClick = (track: Track) => {
    setPinnedId(track.id);
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      play(track);
    }
  };

  const handleDragEnd = (index: number, info: PanInfo) => {
    setDraggingIdx(null);
    const threshold = 24; // vertical px threshold to swap positions
    if (info.offset.y > threshold && index < queue.length - 1) {
      moveQueueTrack(index, index + 1);
    } else if (info.offset.y < -threshold && index > 0) {
      moveQueueTrack(index, index - 1);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
        className="fixed bottom-20 left-3 sm:left-6 lg:left-8 z-40 w-[calc(100vw-2rem)] sm:w-[380px] md:w-[400px] rounded-[2.5rem] bg-zinc-950/95 border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl p-4 sm:p-5 flex flex-col text-white"
      >
        {/* Single Clean Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-white" />
            <h3 className="text-sm font-bold tracking-tight font-instrument">
              Stacked Queue ({queue.length} bài)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider hidden sm:block">
              Kéo dọc đổi vị trí
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Đóng Stacked Queue"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Half-Overlapping Vertical Stacked Area */}
        <div
          style={{ height: `${containerHeight}px` }}
          className="relative w-full my-3 px-1 flex items-center justify-center overflow-hidden transition-all shrink-0"
        >
          <div className="relative w-full h-full">
            <AnimatePresence>
              {displayQueue.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id;
                const isPinned = pinnedId === track.id;

                const topPos = idx * HALF_STACK_STEP;
                const baseZIndex = (idx + 1) * 10;

                const style = isPinned
                  ? {
                      top: '0px',
                      transform: 'scale(1.02)',
                      zIndex: 100,
                    }
                  : {
                      top: `${topPos}px`,
                      zIndex: draggingIdx === idx ? 150 : baseZIndex,
                    };

                return (
                  <motion.div
                    key={track.id}
                    drag="y"
                    dragConstraints={{ top: -140, bottom: 140 }}
                    dragElastic={0.15}
                    onDragStart={() => setDraggingIdx(idx)}
                    onDragEnd={(_, info) => handleDragEnd(idx, info)}
                    whileDrag={{
                      scale: 1.04,
                      zIndex: 200,
                      cursor: 'grabbing',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.9)',
                    }}
                    onClick={() => handleCardClick(track)}
                    style={style}
                    className={cn(
                      "absolute left-0 right-0 h-[72px] rounded-2xl p-3 flex items-center justify-between cursor-grab active:cursor-grabbing transition-all duration-300 ease-out shadow-2xl group border select-none",
                      "hover:!z-[100] hover:scale-[1.02] hover:-translate-y-2 hover:shadow-[0_15px_35px_rgba(0,0,0,0.8)]",
                      isCurrent
                        ? "bg-white text-zinc-950 border-white shadow-[0_10px_30px_rgba(255,255,255,0.4)]"
                        : "bg-zinc-900/95 text-white border-white/15 hover:border-white/40 hover:bg-zinc-900"
                    )}
                  >
                    {/* Left: Drag Handle & Track Details */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <GripVertical
                        className={cn(
                          "w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity",
                          isCurrent ? "text-zinc-950" : "text-zinc-400"
                        )}
                      />

                      <span
                        className={cn(
                          "text-xs font-bold w-4 text-center font-mono shrink-0",
                          isCurrent ? "text-zinc-950" : "text-zinc-500"
                        )}
                      >
                        #{idx + 1}
                      </span>

                      {/* Album Art & Title */}
                      <div className="w-10 h-10 rounded-xl bg-black/20 overflow-hidden shrink-0 border border-white/10">
                        {track.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[7px] font-bold">ART</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <p
                          className={cn(
                            "text-xs font-bold truncate font-instrument leading-tight",
                            isCurrent ? "text-zinc-950" : "text-white"
                          )}
                        >
                          {track.title}
                        </p>
                        <p
                          className={cn(
                            "text-[10px] truncate font-medium",
                            isCurrent ? "text-zinc-700" : "text-zinc-400"
                          )}
                        >
                          {track.artist || 'Nghệ sĩ'}
                        </p>
                      </div>
                    </div>

                    {/* Right: Play Status & Action */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                          isCurrent ? "bg-zinc-950 text-white" : "bg-white/10 text-zinc-300"
                        )}
                      >
                        {isCurrent ? (isPlaying ? 'Playing' : 'Paused') : 'Queue'}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick(track);
                        }}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors cursor-pointer",
                          isCurrent ? "bg-zinc-950 text-white" : "bg-white/10 text-white hover:bg-white/20"
                        )}
                      >
                        {isCurrent && isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default StackedFanDeck;
