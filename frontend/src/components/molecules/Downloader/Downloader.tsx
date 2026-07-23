'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect, SelectOption } from '@/components/ui/custom-select';
import { Download, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
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

  const albumOptions: SelectOption[] = [
    {
      value: '',
      label: t('no_album_single') || 'Không chọn album (Single)',
      description: 'Lưu bài hát dưới dạng Single độc lập',
    },
    ...(Array.isArray(albums) ? albums : []).map((album) => ({
      value: album.id,
      label: album.title,
      description: album.artist ? `Nghệ sĩ: ${album.artist}` : 'Album nhạc',
    })),
  ];

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
            className="bg-background/50 border-white/5 focus-visible:ring-primary/20 h-11 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative flex-1">
            <Input 
              type="text" 
              placeholder={isFetchingInfo ? t('fetching_title') : (t('song_title_placeholder') || 'Nhập tên bài hát...')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isDownloading || isFetchingInfo}
              required
              className="bg-background/50 border-white/5 focus-visible:ring-primary/20 h-11 rounded-xl"
            />
          </div>

          <div className="relative flex-1">
            <Input 
              type="text" 
              placeholder={isFetchingInfo ? t('fetching_artist') : t('artist_optional')}
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              disabled={isDownloading || isFetchingInfo}
              className="bg-background/50 border-white/5 focus-visible:ring-primary/20 h-11 rounded-xl"
            />
          </div>
        </div>

        {/* Metadata Auto-Fetch Lazy Loading Banner (Single Centered Loading Indicator) */}
        <AnimatePresence>
          {isFetchingInfo && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex flex-col items-center justify-center p-4 gap-2 text-xs text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center"
            >
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
              <span className="font-medium">Đang tự động tải thông tin bài hát & nghệ sĩ từ YouTube...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Styled Album Selection Dropdown */}
        <CustomSelect
          value={selectedAlbumId}
          onChange={(val) => setSelectedAlbumId(val)}
          options={albumOptions}
          disabled={isDownloading || isFetchingInfo}
          onOpen={loadAlbums}
          placeholder={t('no_album_single') || 'Không chọn album (Single)'}
        />

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
