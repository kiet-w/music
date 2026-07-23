'use client';

// ponytail: minimal clean stacked deck — big play button + dot grid handle, zero unnecessary animation
import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo, useDragControls } from 'framer-motion';
import { Play, Pause, Layers, X } from 'lucide-react';
import { usePlayerStore, Track } from '@/store/usePlayerStore';
import { cn } from '@/lib/utils';

interface StackedFanDeckProps {
  isOpen?: boolean;
  onClose: () => void;
}

const HALF_STACK_STEP = 38;

// ponytail: 6-dot grid icon matching the reference image
function DotGrid({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className={className}>
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

function DraggableCard({
  track,
  idx,
  isCurrent,
  isPlaying,
  topPos,
  baseZIndex,
  draggingIdx,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  track: Track;
  idx: number;
  isCurrent: boolean;
  isPlaying: boolean;
  topPos: number;
  baseZIndex: number;
  draggingIdx: number | null;
  onDragStart: () => void;
  onDragEnd: (info: PanInfo) => void;
  onClick: () => void;
}) {
  const dragControls = useDragControls();

  return (
    <motion.div
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: -50, bottom: 50 }}
      dragElastic={0.08}
      dragSnapToOrigin
      onDragStart={onDragStart}
      onDragEnd={(_, info) => onDragEnd(info)}
      style={{
        top: `${topPos}px`,
        zIndex: draggingIdx === idx ? 150 : baseZIndex,
      }}
      className={cn(
        "absolute left-0 right-0 h-[72px] rounded-2xl px-3 flex items-center gap-3 border select-none",
        isCurrent
          ? "bg-white text-zinc-950 border-white/80"
          : "bg-zinc-900 text-white border-white/10"
      )}
    >
      {/* Play/Pause Button — large circle */}
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={cn(
          "w-11 h-11 rounded-full flex items-center justify-center shrink-0 cursor-pointer",
          isCurrent
            ? "bg-zinc-950 text-white"
            : "bg-white/10 text-white"
        )}
      >
        {isCurrent && isPlaying
          ? <Pause size={18} fill="currentColor" />
          : <Play size={18} fill="currentColor" className="ml-0.5" />
        }
      </button>

      {/* Track Title — minimal */}
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-semibold truncate", isCurrent ? "text-zinc-950" : "text-white")}>
          {track.title}
        </p>
        <p className={cn("text-[11px] truncate", isCurrent ? "text-zinc-500" : "text-zinc-500")}>
          {track.artist || 'Nghệ sĩ'}
        </p>
      </div>

      {/* Dot Grid Drag Handle */}
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing touch-none",
          isCurrent
            ? "bg-zinc-100 text-zinc-400"
            : "bg-white/5 text-zinc-600 hover:text-zinc-400"
        )}
        title="Giữ để kéo"
      >
        <DotGrid />
      </div>
    </motion.div>
  );
}

export function StackedFanDeck({ isOpen = true, onClose }: StackedFanDeckProps) {
  const { queue, currentTrack, isPlaying, play, togglePlay, moveQueueTrack } = usePlayerStore();
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  if (!isOpen || queue.length === 0) return null;

  const displayQueue = queue.slice(0, 5);
  const containerHeight = Math.min(displayQueue.length * HALF_STACK_STEP + 48, 250);

  const handleCardClick = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      play(track);
    }
  };

  const handleDragEnd = (index: number, info: PanInfo) => {
    setDraggingIdx(null);
    const threshold = 24;
    if (info.offset.y > threshold && index < queue.length - 1) {
      moveQueueTrack(index, index + 1);
    } else if (info.offset.y < -threshold && index > 0) {
      moveQueueTrack(index, index - 1);
    }
  };

  return (
    <div className="w-[340px] max-w-[45vw] rounded-[2rem] bg-zinc-950/95 border border-white/10 backdrop-blur-xl p-4 flex flex-col text-white shrink-0 self-end shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-400">
            Queue · {queue.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-zinc-500 hover:text-white cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Stacked Cards */}
      <div
        style={{ height: `${containerHeight}px` }}
        className="relative w-full overflow-hidden shrink-0"
      >
        <div className="relative w-full h-full">
          {displayQueue.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id;
            const topPos = idx * HALF_STACK_STEP;
            const baseZIndex = (idx + 1) * 10;

            return (
              <DraggableCard
                key={track.id}
                track={track}
                idx={idx}
                isCurrent={isCurrent}
                isPlaying={isPlaying}
                topPos={topPos}
                baseZIndex={baseZIndex}
                draggingIdx={draggingIdx}
                onDragStart={() => setDraggingIdx(idx)}
                onDragEnd={(info) => handleDragEnd(idx, info)}
                onClick={() => handleCardClick(track)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default StackedFanDeck;
