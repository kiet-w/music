'use client';

import React, { useState, useEffect } from 'react';
import { Share2, Copy, Plus } from 'lucide-react';
import { usePlayerStore, Track } from '@/store/usePlayerStore';
import { toast } from 'sonner';
import { ShareTrackModal } from './ShareTrackModal';
import { motion, AnimatePresence } from 'framer-motion';

interface TrackMoreOptionsPopupProps {
  track: {
    id: string;
    title: string;
    artist?: string | null;
    url?: string;
    coverUrl?: string | null;
    cover?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function TrackMoreOptionsPopup({ track, isOpen, onClose }: TrackMoreOptionsPopupProps) {
  const { addToQueue } = usePlayerStore();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
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

  if (!isOpen && !isShareModalOpen) return null;

  const handleOpenShareModal = () => {
    onClose();
    setIsShareModalOpen(true);
  };

  const handleCopyLink = () => {
    onClose();
    const shareText = `🎵 ${track.title} - ${track.artist || 'Nghệ sĩ'} ${track.url ? `| ${track.url}` : ''}`;
    navigator.clipboard.writeText(shareText);
    toast.success('Đã sao chép liên kết bài hát!');
  };

  const handleAddToQueue = () => {
    onClose();
    const trackToQueue: Track = {
      id: track.id,
      title: track.title,
      artist: track.artist || null,
      coverUrl: track.coverUrl || track.cover || undefined,
      url: track.url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    };
    addToQueue(trackToQueue);
    toast.success(`Đã thêm "${track.title}" vào hàng chờ!`);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div 
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md select-none cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="relative w-80 rounded-[2rem] bg-zinc-950 border border-white/15 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.95)] text-white flex flex-col gap-2.5 cursor-default"
            >
              {/* Header */}
              <div className="pb-2 border-b border-white/10 mb-1">
                <p className="text-sm font-bold truncate text-white leading-tight">{track.title}</p>
                <p className="text-xs text-zinc-400 truncate mt-0.5">{track.artist || 'Nghệ sĩ'}</p>
              </div>

              {/* Full-width dark pill buttons */}
              <button
                type="button"
                onClick={handleOpenShareModal}
                className="w-full h-12 px-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 flex items-center gap-3 text-sm font-semibold text-white transition-all cursor-pointer active:scale-95 shadow-md"
              >
                <Share2 size={16} className="text-white shrink-0" />
                <span>Gửi nhạc cho bạn bè</span>
              </button>

              <button
                type="button"
                onClick={handleAddToQueue}
                className="w-full h-12 px-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 flex items-center gap-3 text-sm font-semibold text-white transition-all cursor-pointer active:scale-95 shadow-md"
              >
                <Plus size={16} className="text-white shrink-0" />
                <span>Thêm vào hàng chờ</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full h-12 px-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 flex items-center gap-3 text-sm font-semibold text-white transition-all cursor-pointer active:scale-95 shadow-md"
              >
                <Copy size={16} className="text-white shrink-0" />
                <span>Sao chép liên kết</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Floating Share Modal */}
      <ShareTrackModal
        track={track}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </>
  );
}
