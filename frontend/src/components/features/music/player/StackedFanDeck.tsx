'use client';

// ponytail: 2D hand-drawn fan deck + drag & drop reorderable queue using Framer Motion Reorder
import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Play, Pause, Pin, ArrowUp, ArrowDown, GripVertical, Trash2, Layers, Shuffle } from 'lucide-react';
import { usePlayerStore, Track } from '@/store/usePlayerStore';
import { cn } from '@/lib/utils';

interface StackedFanDeckProps {
  onClose?: () => void;
}

const CARD_LAYOUTS = [
  { left: 0,   top: 46, rotate: -6, zIndex: 10 },
  { left: 46,  top: 34, rotate: -3, zIndex: 20 },
  { left: 92,  top: 24, rotate: 0,  zIndex: 30 },
  { left: 138, top: 16, rotate: 3,  zIndex: 40 },
  { left: 184, top: 10, rotate: 6,  zIndex: 50 },
];

export function StackedFanDeck({ onClose }: StackedFanDeckProps) {
  const { queue, currentTrack, isPlaying, play, togglePlay, reorderQueue, moveQueueTrack, removeFromQueue } = usePlayerStore();
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'fan' | 'drag'>('drag'); // default to drag for immediate drag-and-drop

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

  const handleReorder = (newQueue: Track[]) => {
    reorderQueue(newQueue);
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

        {/* View Mode Toggle: Fan 2D vs Touch Drag */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setViewMode('drag')}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer",
              viewMode === 'drag' ? "bg-white text-zinc-950 shadow-md" : "text-zinc-400 hover:text-white"
            )}
          >
            <GripVertical size={12} />
            <span>Kéo thả (Drag)</span>
          </button>
          <button
            onClick={() => setViewMode('fan')}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer",
              viewMode === 'fan' ? "bg-white text-zinc-950 shadow-md" : "text-zinc-400 hover:text-white"
            )}
          >
            <Layers size={12} />
            <span>Xòe 2D (Fan)</span>
          </button>
        </div>
      </div>

      {/* MODE 1: DRAG & DROP REORDERABLE LIST */}
      {viewMode === 'drag' && (
        <Reorder.Group
          axis="y"
          values={queue}
          onReorder={handleReorder}
          className="flex flex-col gap-2 max-h-[220px] overflow-y-auto py-1 pr-0.5 scrollbar-hide"
        >
          {queue.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <Reorder.Item
                key={track.id}
                value={track}
                whileDrag={{ scale: 1.03, zIndex: 100 }}
                className={cn(
                  "flex items-center justify-between p-3 rounded-2xl transition-all border select-none cursor-grab active:cursor-grabbing",
                  isCurrent
                    ? "bg-white text-zinc-950 border-white shadow-lg"
                    : "bg-zinc-900/90 text-white border-white/10 hover:border-white/30"
                )}
              >
                {/* Drag Handle & Index */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <GripVertical className={cn("w-4 h-4 shrink-0 cursor-grab active:cursor-grabbing", isCurrent ? "text-zinc-950" : "text-zinc-500")} />
                  <span className={cn("text-xs font-bold w-4 text-center font-mono shrink-0", isCurrent ? "text-zinc-950" : "text-zinc-500")}>
                    #{idx + 1}
                  </span>

                  {/* Track Info */}
                  <div
                    onClick={() => play(track)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-black/20 overflow-hidden shrink-0 border border-white/10">
                      {track.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[7px] font-bold">ART</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-xs font-bold truncate font-instrument leading-tight", isCurrent ? "text-zinc-950" : "text-white")}>
                        {track.title}
                      </p>
                      <p className={cn("text-[10px] truncate font-medium", isCurrent ? "text-zinc-700" : "text-zinc-400")}>
                        {track.artist || 'Nghệ sĩ'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions & Remove */}
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    onClick={() => play(track)}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors cursor-pointer",
                      isCurrent ? "hover:bg-zinc-200 text-zinc-950" : "hover:bg-white/10 text-zinc-300 hover:text-white"
                    )}
                    title={isCurrent && isPlaying ? "Tạm dừng" : "Phát ngay"}
                  >
                    {isCurrent && isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                  </button>
                  <button
                    onClick={() => removeFromQueue(track.id)}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors cursor-pointer",
                      isCurrent ? "hover:bg-rose-100 text-rose-600" : "hover:bg-rose-500/20 text-rose-400"
                    )}
                    title="Xóa khỏi danh sách"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      )}

      {/* MODE 2: 2D FAN-OUT HAND-DRAWN STACKED DECK */}
      {viewMode === 'fan' && (
        <div className="relative w-full h-[190px] my-1 px-2 flex items-center justify-center overflow-x-auto scrollbar-hide">
          <div className="relative w-[390px] h-[160px]">
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
      )}
    </div>
  );
}

export default StackedFanDeck;
