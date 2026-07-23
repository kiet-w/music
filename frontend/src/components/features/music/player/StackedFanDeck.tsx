'use client';

// ponytail: 2D vertical hand-drawn stacked cards deck with vertical drag-and-drop reordering
import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Play, Pause, Pin, GripVertical, Trash2, Layers } from 'lucide-react';
import { usePlayerStore, Track } from '@/store/usePlayerStore';
import { cn } from '@/lib/utils';

interface StackedFanDeckProps {
  onClose?: () => void;
}

/*
  Vertical 2D Hand-drawn Stacked Cards Formula (Thẳng hàng dọc lệch nhẹ):
  card 1: top: 0px,   left: 0px,  rotate: -4deg, zIndex: 10
  card 2: top: 32px,  left: 10px, rotate: -2deg, zIndex: 20
  card 3: top: 64px,  left: 20px, rotate: 0deg,  zIndex: 30
  card 4: top: 96px,  left: 30px, rotate: 2deg,  zIndex: 40
  card 5: top: 128px, left: 40px, rotate: 4deg,  zIndex: 50
*/
const VERTICAL_CARD_LAYOUTS = [
  { top: 0,   left: 0,  rotate: -4, zIndex: 10 },
  { top: 32,  left: 10, rotate: -2, zIndex: 20 },
  { top: 64,  left: 20, rotate: 0,  zIndex: 30 },
  { top: 96,  left: 30, rotate: 2,  zIndex: 40 },
  { top: 128, left: 40, rotate: 4,  zIndex: 50 },
];

export function StackedFanDeck({ onClose }: StackedFanDeckProps) {
  const { queue, currentTrack, isPlaying, play, togglePlay, moveQueueTrack, removeFromQueue } = usePlayerStore();
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  if (queue.length === 0) return null;

  const displayQueue = queue.slice(0, 5);

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
    const threshold = 28; // vertical px threshold to trigger reorder swap
    if (info.offset.y > threshold && index < queue.length - 1) {
      moveQueueTrack(index, index + 1);
    } else if (info.offset.y < -threshold && index > 0) {
      moveQueueTrack(index, index - 1);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 p-4 sm:p-5 bg-zinc-950/95 border border-white/15 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 px-1">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-white" />
          <h3 className="text-sm font-bold tracking-tight font-instrument">
            Vertical Stacked Cards ({queue.length} bài)
          </h3>
        </div>
        <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
          Kéo Dọc (Drag Up/Down) đổi thứ tự
        </p>
      </div>

      {/* 2D Vertical Stacked Cards Deck Area with Vertical Dragging */}
      <div className="relative w-full h-[250px] my-1 px-2 flex items-center justify-start overflow-hidden">
        <div className="relative w-full h-[220px]">
          <AnimatePresence>
            {displayQueue.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isPinned = pinnedId === track.id;
              const layout = VERTICAL_CARD_LAYOUTS[Math.min(idx, 4)];

              const style = isPinned
                ? {
                    top: '0px',
                    left: '0px',
                    transform: 'rotate(0deg) scale(1.03)',
                    zIndex: 100,
                  }
                : {
                    top: `${layout.top}px`,
                    left: `${layout.left}px`,
                    transform: `rotate(${layout.rotate}deg)`,
                    zIndex: draggingIdx === idx ? 150 : layout.zIndex,
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
                    scale: 1.05,
                    rotate: 0,
                    zIndex: 200,
                    cursor: 'grabbing',
                  }}
                  onClick={() => handleCardClick(track)}
                  style={style}
                  className={cn(
                    "absolute w-[90%] sm:w-[340px] h-[72px] rounded-2xl p-3 flex items-center justify-between cursor-grab active:cursor-grabbing transition-all duration-300 ease-out shadow-2xl group border select-none",
                    "hover:!left-0 hover:!rotate-0 hover:!z-[100] hover:scale-102 hover:-translate-y-1",
                    isCurrent
                      ? "bg-white text-zinc-950 border-white shadow-[0_10px_30px_rgba(255,255,255,0.4)]"
                      : "bg-zinc-900/95 text-white border-white/15 hover:border-white/40 hover:bg-zinc-900"
                  )}
                >
                  {/* Left: Drag Handle & Index */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <GripVertical className={cn("w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity", isCurrent ? "text-zinc-950" : "text-zinc-400")} />
                    <span className={cn("text-xs font-bold w-4 text-center font-mono shrink-0", isCurrent ? "text-zinc-950" : "text-zinc-500")}>
                      #{idx + 1}
                    </span>

                    {/* Album Art & Track Info */}
                    <div className="w-10 h-10 rounded-xl bg-black/20 overflow-hidden shrink-0 border border-white/10">
                      {track.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[7px] font-bold">ART</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pr-2">
                      <p className={cn("text-xs font-bold truncate font-instrument leading-tight", isCurrent ? "text-zinc-950" : "text-white")}>
                        {track.title}
                      </p>
                      <p className={cn("text-[10px] truncate font-medium", isCurrent ? "text-zinc-700" : "text-zinc-400")}>
                        {track.artist || 'Nghệ sĩ'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Play Action & Status */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", isCurrent ? "bg-zinc-950 text-white" : "bg-white/10 text-zinc-300")}>
                      {isCurrent ? (isPlaying ? 'Playing' : 'Paused') : 'Queue'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(track);
                      }}
                      className={cn("p-1.5 rounded-lg transition-colors", isCurrent ? "bg-zinc-950 text-white" : "bg-white/10 text-white hover:bg-white/20")}
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
    </div>
  );
}

export default StackedFanDeck;
