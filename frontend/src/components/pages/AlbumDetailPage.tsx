'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePlayerStore } from '@/store/usePlayerStore';
import { fetchAlbum } from '@/lib/api';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { useAlbumStore } from '@/store/useAlbumStore';
import { useAuthStore } from '@/store/useAuthStore';
import { AlbumDetailTemplate } from '@/components/templates/AlbumDetail/AlbumDetailTemplate';
import { toast } from 'sonner';

interface AlbumDetailPageProps {
  locale: string;
}

export function AlbumDetailPage({ locale }: AlbumDetailPageProps) {
  const { accessToken: appToken, isHydrated } = useAuthStore();
  const t = useTranslations('Music');
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';
  const { play, currentTrack, isPlaying } = usePlayerStore();
  const [album, setAlbum] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { loadAlbums } = useAlbumStore();

  const loadAlbum = useCallback(async () => {
    if (!appToken) return;
    try {
      const data = await fetchAlbum(appToken, id);
      setAlbum(data);
    } catch (err: any) {
      console.error('Failed to reload album:', err);
      toast.error(err.message || 'Failed to load album details');
    } finally {
      setLoading(false);
    }
  }, [id, appToken]);

  useEffect(() => {
    if (isHydrated && appToken) {
      loadAlbums(appToken);
      loadAlbum();
    } else if (isHydrated && !appToken) {
      router.push(`/${locale}/login`);
    }
  }, [isHydrated, appToken, loadAlbums, loadAlbum, router, locale]);

  useSupabaseRealtime(
    appToken && id ? 'Album' : '',
    loadAlbum,
    id ? `id=eq.${id}` : undefined
  );
  useSupabaseRealtime(
    appToken && id ? 'Track' : '',
    loadAlbum,
    id ? `albumId=eq.${id}` : undefined
  );

  const isAlbumActive = currentTrack?.albumId === id && isPlaying;

  return (
    <AlbumDetailTemplate 
      album={album}
      loading={loading}
      isAlbumActive={isAlbumActive}
      id={id}
      locale={locale}
      currentTrackId={currentTrack?.id}
      play={play}
      t={t}
    />
  );
}
