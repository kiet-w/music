'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Disc, Sparkles, Music } from 'lucide-react';
import { useAlbumStore } from '@/store/useAlbumStore';
import { usePlayerStore, Track } from '@/store/usePlayerStore';
import { getMediaUrl } from '@/lib/utils';
import Library from '@/components/features/music/player/Library';

export interface AlbumDetailModalProps {
  albumId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTrackSelect?: (track: Track, localUrl?: string) => void;
}

export function AlbumDetailModal({ albumId, isOpen, onClose, onTrackSelect }: AlbumDetailModalProps) {
  const { albums } = useAlbumStore();
  const { play, currentTrack } = usePlayerStore();
  const [hasError, setHasError] = useState(false);

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

  if (!isOpen || !albumId) return null;

  const currentAlbum = albums.find((a) => a.id === albumId);
  const title = currentAlbum?.title || 'Album Chi Tiết';
  const artist = currentAlbum?.artist || 'Nhiều nghệ sĩ';
  const mediaUrl = currentAlbum ? getMediaUrl(currentAlbum.coverUrl) : null;

  const handleTrackSelectFromLibrary = (track: any, localUrl?: string) => {
    if (onTrackSelect) {
      onTrackSelect(track, localUrl);
    } else {
      play({
        id: track.id,
        title: track.title,
        artist: track.artist || null,
        url: localUrl || track.url,
        coverUrl: mediaUrl || undefined,
      });
    }
  };

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md select-none cursor-pointer"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-4xl max-h-[88vh] bg-zinc-950/95 border border-white/15 rounded-[2.5rem] p-5 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.95)] text-white flex flex-col gap-5 overflow-hidden cursor-default"
        >
          {/* Album Header Inside Modal */}
          <div className="relative overflow-hidden rounded-3xl bg-zinc-900/80 border border-white/10 p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-end gap-5 shrink-0">
            <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 bg-white/[0.04] rounded-full blur-3xl" />

            {/* Album Cover */}
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-zinc-950 flex items-center justify-center border border-white/15 overflow-hidden shrink-0 shadow-lg relative aspect-square">
              {mediaUrl && !hasError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl}
                  alt={title}
                  onError={() => setHasError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 p-3 text-center">
                  <Disc className="w-10 h-10 text-white/30" />
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-white/40 truncate max-w-[90px]">
                    {title}
                  </span>
                </div>
              )}
            </div>

            {/* Album Information & Quick Actions */}
            <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left w-full pr-2">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-white/70" />
                  Studio Album
                </span>
              </div>

              <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white truncate leading-tight">
                {title}
              </h2>

              <p className="text-xs sm:text-sm text-zinc-400 font-medium truncate">
                Nghệ sĩ: <span className="text-white font-semibold">{artist}</span>
              </p>
            </div>
          </div>

          {/* Album Track List Header */}
          <div className="flex items-center justify-between px-1 shrink-0">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-zinc-400">
              <Music className="w-4 h-4 text-white" />
              <span>Danh sách bài hát trong Album</span>
            </div>
          </div>

          {/* Scrollable Track List Container */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
            <Library 
              albumId={albumId}
              currentTrackId={currentTrack?.id}
              onTrackSelect={handleTrackSelectFromLibrary}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default AlbumDetailModal;
