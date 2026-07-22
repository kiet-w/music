'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { downloadFromYoutube, fetchTrack, fetchYoutubeInfo } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useAlbumStore } from '@/store/useAlbumStore';
import { useDownloadHistoryStore } from '@/store/useDownloadHistoryStore';

export function useYoutubeDownloader(onDownloadStarted?: (url: string) => void) {
  const t = useTranslations('Music');
  const router = useRouter();
  const locale = useLocale();
  const { accessToken } = useAuthStore();
  const { albums, loadAlbums: originalLoadAlbums } = useAlbumStore();
  const { addHistory } = useDownloadHistoryStore();

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const loadAlbums = useCallback(() => {
    if (accessToken) {
      originalLoadAlbums(accessToken);
    }
  }, [accessToken, originalLoadAlbums]);

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  useEffect(() => {
    const fetchInfo = async () => {
      if (!url || !accessToken || title) return;

      const isYoutubeUrl = /^(https?:\/\/)?(www\.youtube\.com|youtu\.be)\/.+$/i.test(url);
      if (!isYoutubeUrl) return;

      setIsFetchingInfo(true);
      try {
        const info = await fetchYoutubeInfo(accessToken, url);
        if (info.title && !title) setTitle(info.title);
        if (info.artist && !artist) setArtist(info.artist);
      } catch (error) {
        console.error('Failed to fetch YouTube info:', error);
      } finally {
        setIsFetchingInfo(false);
      }
    };

    const timer = setTimeout(fetchInfo, 500);
    return () => clearTimeout(timer);
  }, [url, accessToken, title, artist]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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

        const handleSuccess = (updatedTrack?: any) => {
          if (isCompleted) return;
          isCompleted = true;
          setStatus(t('import_success'));
          setIsDownloading(false);

          // Instantly refresh albums list so dropdown updates across the app
          if (accessToken) {
            useAlbumStore.getState().loadAlbums(accessToken);
          }

          const album = (Array.isArray(albums) ? albums : []).find((a) => a.id === selectedAlbumId);
          const { user } = useAuthStore.getState();
          if (user) {
            addHistory(user.id, updatedTrack || song, album?.title || 'Single');
          }

          setUrl('');
          setTitle('');
          setArtist('');
          setSelectedAlbumId('');
          if (onDownloadStarted) onDownloadStarted(url);
          setTimeout(() => setStatus(null), 5000);
        };

        if (song.url) {
          handleSuccess(song);
          return;
        }

        setStatus(t('converting'));

        const poll = async () => {
          if (isCompleted) return;

          try {
            const updatedSong = await fetchTrack(accessToken, songId);
            if (updatedSong.url && !isCompleted) {
              handleSuccess(updatedSong);
            } else if (!isCompleted) {
              setTimeout(poll, 3000);
            }
          } catch (err) {
            console.error('Polling error:', err);
            if (!isCompleted) setTimeout(poll, 5000);
          }
        };

        setTimeout(poll, 3000);
      } catch (err: any) {
        console.error('Download error:', err);
        setStatus(err.message || 'Download failed');
        setIsDownloading(false);
      }
    },
    [accessToken, albums, artist, locale, onDownloadStarted, router, selectedAlbumId, t, title, url, addHistory]
  );

  return {
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
  };
}
