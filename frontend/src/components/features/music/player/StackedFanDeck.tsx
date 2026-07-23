'use client';

// ponytail: 2D hand-drawn stacked cards fan deck implementing exact CSS rotate & top offset values
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Pin, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { usePlayerStore, Track } from '@/store/usePlayerStore';
import { cn } from '@/lib/utils';

interface StackedFanDeckProps {
  onClose?: () => void;
}

/* 
  Exact 2D rotate & top offset formula specified by user:
  card:nth-child(1) { left: 0px;   top: 46px; transform: rotate(-6deg); }
  card:nth-child(2) { left: 46px;  top: 34px; transform: rotate(-3deg); }
  card:nth-child(3) { left: 92px;  top: 24px; transform: rotate(0deg);  }
  card:nth-child(4) { left: 138px; top: 16px; transform: rotate(3deg);  }
  card:nth-child(5) { left: 184px; top: 10px; transform: rotate(6deg);  }
*/
const CARD_LAYOUTS = [
  { left: 0,   top: 46, rotate: -6, zIndex: 10 },
  { left: 46,  top: 34, rotate: -3, zIndex: 20 },
  { left: 92,  top: 24, rotate: 0,  zIndex: 30 },
  { left: 138, top: 16, rotate: 3,  zIndex: 40 },
  { left: 184, top: 10, rotate: 6,  zIndex: 50 },
];

export function StackedFanDeck({ onClose }: StackedFanDeckProps) {
  const { queue, currentTrack, isPlaying, play, togglePlay, moveQueueTrack, removeFromQueue } = usePlayerStore();
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  if (queue.length === 0) return null;

  // Display up to 5 stacked cards
  const displayQueue = queue.slice(0, 5);

  const handleCardClick = (track: Track) => {
    setPinnedId(track.id);
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      play(track);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 p-4 sm:p-5 bg-zinc-950/95 border border-white/15 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          <h3 className="text-sm font-bold tracking-tight font-instrument">
            Stacked Cards Queue ({queue.length} bài)
          </h3>
        </div>
        <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider hidden sm:block">
          Hover nổi thẻ & thẳng góc / Click ghim đầu
        </p>
      </div>

      {/* Fan-Out Stacked Cards Deck Area */}
      <div className="relative w-full h-[200px] my-2 px-2 flex items-center justify-center overflow-x-auto scrollbar-hide">
        <div className="relative w-[390px] h-[170px]">
          <AnimatePresence>
            {displayQueue.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isPinned = pinnedId === track.id;
              const layout = CARD_LAYOUTS[Math.min(idx, 4)];

              const style = isPinned
                ? {
                    left: `${layout.left}px`,
                    top: '0px',
                    transform: 'rotate(0deg) scale(1.05)',
                    zIndex: 100,
                  }
                : {
                    left: `${layout.left}px`,
                    top: `${layout.top}px`,
                    transform: `rotate(${layout.rotate}deg)`,
                    zIndex: layout.zIndex,
                  };

              return (
                <div
                  key={track.id}
                  onClick={() => handleCardClick(track)}
                  style={style}
                  className={cn(
                    "absolute w-[190px] h-[125px] rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-300 ease-out shadow-2xl group border",
                    "hover:!top-1 hover:!rotate-0 hover:!z-[100] hover:scale-105 hover:-translate-y-2",
                    isCurrent
                      ? "bg-white text-zinc-950 border-white shadow-[0_10px_30px_rgba(255,255,255,0.4)]"
                      : "bg-zinc-900/95 text-white border-white/15 hover:border-white/40 hover:bg-zinc-900"
                  )}
                >
                  {/* Card Header & Controls */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={cn("text-[10px] font-extrabold font-mono", isCurrent ? "text-zinc-950" : "text-zinc-400")}>
                        #{idx + 1}
                      </span>
                      <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full truncate", isCurrent ? "bg-zinc-950 text-white" : "bg-white/10 text-zinc-300")}>
                        {isCurrent ? (isPlaying ? 'Playing' : 'Paused') : 'Queue'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveQueueTrack(idx, Math.max(0, idx - 1));
                        }}
                        disabled={idx === 0}
                        className={cn("p-0.5 rounded transition-colors disabled:opacity-20", isCurrent ? "hover:bg-zinc-200 text-zinc-950" : "hover:bg-white/20 text-zinc-300")}
                        title="Đẩy lên trước"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveQueueTrack(idx, Math.min(queue.length - 1, idx + 1));
                        }}
                        disabled={idx === queue.length - 1}
                        className={cn("p-0.5 rounded transition-colors disabled:opacity-20", isCurrent ? "hover:bg-zinc-200 text-zinc-950" : "hover:bg-white/20 text-zinc-300")}
                        title="Đẩy xuống sau"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Card Title & Artist */}
                  <div className="min-w-0 my-1">
                    <h4 className={cn("text-xs font-bold truncate font-instrument leading-snug", isCurrent ? "text-zinc-950" : "text-white")}>
                      {track.title}
                    </h4>
                    <p className={cn("text-[10px] truncate font-medium", isCurrent ? "text-zinc-700" : "text-zinc-400")}>
                      {track.artist || 'Nghệ sĩ'}
                    </p>
                  </div>

                  {/* Play Action */}
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1">
                      {isCurrent && isPlaying ? (
                        <Pause size={13} fill="currentColor" />
                      ) : (
                        <Play size={13} fill="currentColor" />
                      )}
                      <span className="font-semibold">{isCurrent ? (isPlaying ? 'Tạm dừng' : 'Phát tiếp') : 'Phát ngay'}</span>
                    </div>
                    {isPinned && <Pin size={11} className="text-zinc-400" />}
                  </div>
                </div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default StackedFanDeck;
