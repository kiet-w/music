'use client';

// ponytail: monochromatic youtube mp3 downloader form component with album selector
import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect, SelectOption } from '@/components/ui/custom-select';
import { Download, Loader2, CheckCircle2, Link as LinkIcon, Disc } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useYoutubeDownloader } from '@/hooks/useYoutubeDownloader';
import { GlobalLoading } from '@/components/atoms/GlobalLoading';

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
    <div className="w-full space-y-4 p-4 rounded-2xl bg-white/5 text-white">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t('paste_url') || 'Đường dẫn YouTube'}</span>
          </label>
          <Input
            type="text"
            placeholder="Dán URL YouTube (ví dụ: https://youtu.be/...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isDownloading}
            required
            className="bg-zinc-900/90 border-none focus-visible:ring-1 focus-visible:ring-white/20 h-10 rounded-xl text-white placeholder:text-zinc-500 text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              {t('song_title') || 'Tên bài hát *'}
            </label>
            <Input
              type="text"
              placeholder={isFetchingInfo ? t('fetching_title') || 'Đang lấy tên...' : t('song_title_placeholder') || 'Tên bài hát'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isDownloading || isFetchingInfo}
              required
              className="bg-zinc-950/80 border-white/10 focus-visible:ring-white/20 h-11 rounded-xl text-white placeholder:text-zinc-500 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">
              {t('artist_optional') || 'Ca sĩ'}
            </label>
            <Input
              type="text"
              placeholder={isFetchingInfo ? t('fetching_artist') || 'Đang lấy ca sĩ...' : t('artist_optional') || 'Tên nghệ sĩ'}
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              disabled={isDownloading || isFetchingInfo}
              className="bg-zinc-950/80 border-white/10 focus-visible:ring-white/20 h-11 rounded-xl text-white placeholder:text-zinc-500 text-xs"
            />
          </div>
        </div>

        {/* Metadata Auto-Fetch Loading */}
        {isFetchingInfo && (
          <GlobalLoading message={t('fetching_title') || 'Đang tự động tải thông tin bài hát & nghệ sĩ...'} />
        )}

        {/* Album Selection Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
            <Disc className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t('select_album') || 'Lưu vào Album'}</span>
          </label>
          <CustomSelect
            value={selectedAlbumId}
            onChange={(val) => setSelectedAlbumId(val)}
            options={albumOptions}
            disabled={isDownloading || isFetchingInfo}
            onOpen={loadAlbums}
            placeholder={t('no_album_single') || 'Không chọn album (Single)'}
          />
        </div>

        <Button
          type="submit"
          disabled={isDownloading || isFetchingInfo || !url || !title}
          className="w-full h-11 mt-1 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-lg disabled:opacity-50"
        >
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-zinc-950" />
              <span>{t('downloading') || 'Đang chuyển đổi...'}</span>
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4 text-zinc-950" />
              <span>{t('download') || 'Chuyển đổi YouTube MP3'}</span>
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
            className="space-y-2 pt-1"
          >
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white"
                initial={{ width: '0%' }}
                animate={{ width: '95%' }}
                transition={{ duration: 20, ease: 'easeOut' }}
              />
            </div>
            <p className="text-[11px] text-center text-zinc-400 font-medium animate-pulse">
              {status || 'Đang xử lý tải bài hát từ YouTube...'}
            </p>
          </motion.div>
        ) : status === t('import_success') || status === 'Tải nhạc thành công và đã thêm vào thư viện!' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900 border border-white/20 text-white text-xs font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{t('import_success') || 'Tải bài hát thành công!'}</span>
          </motion.div>
        ) : status ? (
          <motion.p
            key="status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] text-center text-zinc-400 font-medium"
          >
            {status}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
