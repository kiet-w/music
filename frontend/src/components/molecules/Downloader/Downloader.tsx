'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/atoms/ui/button';
import { Input } from '@/components/atoms/ui/input';
import { Download, Loader2, CheckCircle2 } from 'lucide-react';
import { downloadFromYoutube, fetchTrack } from '@/lib/api';
import { supabase, isConfigured } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

import { useAlbumStore } from '@/store/useAlbumStore';

interface DownloaderProps {
  onDownloadStarted?: (url: string) => void;
}

export const Downloader: React.FC<DownloaderProps> = ({ onDownloadStarted }) => {
  const t = useTranslations('Music');
  const router = useRouter();
  const locale = useLocale();
  const { accessToken, clearSession } = useAuthStore();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const { albums, loadAlbums: originalLoadAlbums } = useAlbumStore();
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const loadAlbums = useCallback(() => {
    if (accessToken) {
      originalLoadAlbums(accessToken);
    }
  }, [accessToken, originalLoadAlbums]);

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      router.push(`/${locale}/login`);
      return;
    }
    if (!url || !title) return;

    setIsDownloading(true);
    setStatus(t('preparing'));

    try {
      const song = await downloadFromYoutube(accessToken, url, title, artist, selectedAlbumId || undefined);
      const songId = song.id;
      
      let isCompleted = false;

      const handleSuccess = () => {
        if (isCompleted) return;
        isCompleted = true;
        setStatus(t('success'));
        setIsDownloading(false);
        setUrl('');
        setTitle('');
        setArtist('');
        setSelectedAlbumId('');
        if (onDownloadStarted) onDownloadStarted(url);
        setTimeout(() => setStatus(null), 5000);
      };

      // 1. Supabase Realtime Subscription (if configured)
      let channel: any = null;
      if (isConfigured && supabase) {
        try {
          channel = supabase
            .channel(`download-${songId}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'Track',
                filter: `id=eq.${songId}`,
              },
              (payload) => {
                const updatedSong = payload.new as any;
                if (updatedSong.url && !isCompleted) {
                  handleSuccess();
                  if (channel) supabase.removeChannel(channel);
                }
              }
            )
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                setStatus(t('converting'));
              }
            });
        } catch (err) {
          console.error('Supabase subscription error:', err);
          setStatus(t('converting'));
        }
      } else {
        setStatus(t('converting'));
      }

      // 2. Polling Fallback
      const poll = async () => {
        if (isCompleted) return;

        try {
          const updatedSong = await fetchTrack(accessToken, songId);
          if (updatedSong.url && !isCompleted) {
            handleSuccess();
            if (channel) supabase.removeChannel(channel);
          } else if (!isCompleted) {
            setTimeout(poll, 3000);
          }
        } catch (err: any) {
          console.error('Polling error:', err);
          if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
            isCompleted = true;
            clearSession();
            router.push(`/${locale}/login`);
            return;
          }
          if (!isCompleted) setTimeout(poll, 5000);
        }
      };

      setTimeout(poll, 3000);

      // 3. Fallback timeout to cleanup
      setTimeout(() => {
        if (!isCompleted) {
          isCompleted = true;
          if (channel) supabase.removeChannel(channel);
          setIsDownloading(false);
          setStatus('Download timed out');
        }
      }, 180000); // 3 minutes

    } catch (error: any) {
      console.error('Error starting download:', error);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        clearSession();
        router.push(`/${locale}/login`);
      } else {
        setStatus('Error starting download');
      }
      setIsDownloading(false);
    }
  }, [url, title, artist, selectedAlbumId, t, onDownloadStarted, accessToken, router, clearSession, locale]);

  return (
    <div className="w-full space-y-4 p-5 rounded-2xl bg-secondary/5 border-none shadow-inner">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input 
          type="text" 
          placeholder={t('paste_url')}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isDownloading}
          required
          className="bg-background/50 border-white/5 focus-visible:ring-primary/20 h-11 rounded-xl"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input 
            type="text" 
            placeholder="Song Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isDownloading}
            required
            className="bg-background/50 border-white/5 focus-visible:ring-primary/20 h-11 rounded-xl"
          />
          <Input 
            type="text" 
            placeholder="Artist (Optional)"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            disabled={isDownloading}
            className="bg-background/50 border-white/5 focus-visible:ring-primary/20 h-11 rounded-xl"
          />
        </div>
        <select
          value={selectedAlbumId}
          onFocus={loadAlbums}
          onChange={(e) => setSelectedAlbumId(e.target.value)}
          disabled={isDownloading}
          className="w-full h-11 rounded-xl bg-background/50 border-white/5 focus-visible:ring-primary/20 text-white/70 px-3 outline-none appearance-none"
        >
          <option value="">No Album (Single)</option>
          {albums.map((album) => (
            <option key={album.id} value={album.id}>
              {album.title}
            </option>
          ))}
        </select>
        <Button 
          type="submit" 
          disabled={isDownloading || !url || !title}
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
        ) : status === t('success') ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm font-bold"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Added to Library</span>
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
