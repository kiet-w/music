'use client';

// ponytail: ultra-clean straight vertical stacked queue deck with smooth Reorder drag & drop (0deg tilt)
import React from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Play, Pause, GripVertical, Trash2, Layers, X } from 'lucide-react';
import { usePlayerStore, Track } from '@/store/usePlayerStore';
import { cn } from '@/lib/utils';

interface StackedFanDeckProps {
  onClose?: () => void;
}

export function StackedFanDeck({ onClose }: StackedFanDeckProps) {
  const { queue, currentTrack, isPlaying, play, togglePlay, setQueue, removeFromQueue } = usePlayerStore();

  if (queue.length === 0) return null;

  const handleReorder = (newQueue: Track[]) => {
    setQueue(newQueue);
  };

  return (
    <div className="w-full flex flex-col gap-3 p-4 sm:p-5 bg-zinc-950/95 border border-white/15 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl text-white overflow-hidden">
      {/* Clean Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-white/10 text-white shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight font-instrument leading-tight">
              Danh sách sắp xếp ({queue.length} bài)
            </h3>
            <p className="text-[11px] text-zinc-400 font-medium">
              Kéo thả dọc để thay đổi thứ tự nghe
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Ultra-Clean Straight Vertical Drag-and-Drop List (0deg tilt) */}
      <Reorder.Group
        axis="y"
        values={queue}
        onReorder={handleReorder}
        className="flex flex-col gap-2 max-h-[260px] overflow-y-auto py-1 pr-0.5 scrollbar-hide"
      >
        {queue.map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;

          return (
            <Reorder.Item
              key={track.id}
              value={track}
              whileDrag={{
                scale: 1.02,
                boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
                zIndex: 100,
              }}
              className={cn(
                "flex items-center justify-between p-3 rounded-2xl transition-all border select-none cursor-grab active:cursor-grabbing",
                isCurrent
                  ? "bg-white text-zinc-950 border-white shadow-lg"
                  : "bg-zinc-900/90 text-white border-white/10 hover:border-white/30 hover:bg-zinc-900"
              )}
            >
              {/* Drag Handle & Track Details */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <GripVertical
                  className={cn(
                    "w-4 h-4 shrink-0 cursor-grab active:cursor-grabbing",
                    isCurrent ? "text-zinc-950 opacity-80" : "text-zinc-500"
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
                <div
                  onClick={() => play(track)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-black/20 overflow-hidden shrink-0 border border-white/10">
                    {track.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[7px] font-bold">ART</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
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
              </div>

              {/* Status Badge & Controls */}
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                    isCurrent ? "bg-zinc-950 text-white" : "bg-white/10 text-zinc-300"
                  )}
                >
                  {isCurrent ? (isPlaying ? 'Playing' : 'Paused') : 'Queue'}
                </span>

                <button
                  onClick={() => (isCurrent ? togglePlay() : play(track))}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors cursor-pointer",
                    isCurrent
                      ? "hover:bg-zinc-200 text-zinc-950"
                      : "hover:bg-white/10 text-zinc-300 hover:text-white"
                  )}
                  title={isCurrent && isPlaying ? "Tạm dừng" : "Phát ngay"}
                >
                  {isCurrent && isPlaying ? (
                    <Pause size={14} fill="currentColor" />
                  ) : (
                    <Play size={14} fill="currentColor" />
                  )}
                </button>

                <button
                  onClick={() => removeFromQueue(track.id)}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors cursor-pointer",
                    isCurrent
                      ? "hover:bg-rose-100 text-rose-600"
                      : "hover:bg-rose-500/20 text-rose-400"
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
    </div>
  );
}

export default StackedFanDeck;
