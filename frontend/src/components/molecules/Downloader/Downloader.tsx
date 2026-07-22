'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { Download, Loader2, CheckCircle2, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useYoutubeDownloader } from '@/hooks/useYoutubeDownloader';

interface DownloaderProps {
  onDownloadStarted?: (url: string) => void;
}

export default function Downloader({ onDownloadStarted }: DownloaderProps) {
  const t = useTranslations('Music');
  const {
    url,
    setUrl,
    title,
    setTitle,
    artist,
    setArtist,
    albums,
    selectedAlbumId,
    setSelectedAlbumId,
    isDownloading,
    isFetchingInfo,
    loadAlbums,
    status,
    handleSubmit,
  } = useYoutubeDownloader(onDownloadStarted);

  return (
    <div className="w-full space-y-4 p-5 rounded-2xl bg-secondary/5 border-none shadow-inner">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative w-full">
          <Input 
            type="text" 
            placeholder={t('paste_url')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isDownloading}
            required
            className="bg-background/50 border-white/5 focus-visible:ring-primary/20 h-11 rounded-xl pr-10"
          />
          {isFetchingInfo && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-emerald-400">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative flex-1">
            <Input 
              type="text" 
              placeholder={isFetchingInfo ? (t('fetching_title') || 'Fetching Title...') : 'Song Title'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isDownloading || isFetchingInfo}
              required
              className="bg-background/50 border-white/5 focus-visible:ring-primary/20 h-11 rounded-xl pr-9"
            />
            {isFetchingInfo && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-emerald-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
          </div>

          <div className="relative flex-1">
            <Input 
              type="text" 
              placeholder={isFetchingInfo ? (t('fetching_artist') || 'Fetching Artist...') : 'Artist (Optional)'}
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              disabled={isDownloading || isFetchingInfo}
              className="bg-background/50 border-white/5 focus-visible:ring-primary/20 h-11 rounded-xl pr-9"
            />
            {isFetchingInfo && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-emerald-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Metadata Auto-Fetch Lazy Loading Banner */}
        <AnimatePresence>
          {isFetchingInfo && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20"
            >
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Đang tự động tải thông tin bài hát & nghệ sĩ từ YouTube...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Styled Album Selection Dropdown */}
        <div className="relative w-full">
          <select
            value={selectedAlbumId}
            onFocus={loadAlbums}
            onChange={(e) => setSelectedAlbumId(e.target.value)}
            disabled={isDownloading || isFetchingInfo}
            className="w-full h-11 rounded-xl bg-background/50 border border-white/10 focus:border-emerald-500/50 text-white/90 px-4 pr-10 outline-none appearance-none cursor-pointer transition-all text-sm font-medium disabled:opacity-50"
          >
            <option value="" className="bg-[#121212] text-white">
              {t('no_album_single') || 'Không chọn album (Single)'}
            </option>
            {(Array.isArray(albums) ? albums : []).map((album) => (
              <option key={album.id} value={album.id} className="bg-[#121212] text-white">
                🎵 Album: {album.title}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        <Button 
          type="submit" 
          disabled={isDownloading || isFetchingInfo || !url || !title}
          className="w-full h-11 rounded-xl bg-white text-black hover:bg-white/90 shadow-glow font-bold transition-all active:scale-95"
        >
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t('downloading')}
            </>
          ) : (
            <>
              <Download className="mr-2 h-5 w-5" />
              {t('download')}
            </>
          )}
        </Button>
      </form>
      
      <AnimatePresence mode="wait">
        {isDownloading ? (
          <motion.div 
            key="processing"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: "95%" }}
                transition={{ duration: 20, ease: "easeOut" }}
              />
            </div>
            <p className="text-[11px] text-center text-white/60 font-bold uppercase tracking-widest animate-pulse">
              {status}
            </p>
          </motion.div>
        ) : status === t('import_success') ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm font-bold"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('import_success')}</span>
          </motion.div>
        ) : status && (
          <motion.p 
            key="status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] text-center text-white/60 font-bold uppercase tracking-widest"
          >
            {status}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
