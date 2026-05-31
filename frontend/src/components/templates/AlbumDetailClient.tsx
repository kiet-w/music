'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Library } from '@/components/molecules/Library/Library';
import { Button } from '@/components/atoms/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePlayerStore } from '@/store/usePlayerStore';
import { fetchAlbum } from '@/lib/api';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { useAlbumStore } from '@/store/useAlbumStore';
import { useAuthStore } from '@/store/useAuthStore';

interface AlbumDetailClientProps {
  locale: string;
  id: string;
}

export default function AlbumDetailClient({ locale, id }: AlbumDetailClientProps) {
  const { accessToken: appToken, isHydrated, clearSession } = useAuthStore();
  const t = useTranslations('Music');
  const router = useRouter();
  const { play, currentTrack } = usePlayerStore();
  const [album, setAlbum] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { albums, loadAlbums } = useAlbumStore();

  const loadAlbum = useCallback(async () => {
    if (!appToken) return;
    try {
      const data = await fetchAlbum(appToken, id);
      setAlbum(data);
    } catch (err: any) {
      console.error('Failed to reload album:', err);
      if (err.message?.includes('401') || err.message?.toLowerCase()?.includes('unauthorized')) {
        clearSession();
        router.push(`/${locale}/login`);
      }
    } finally {
      setLoading(false);
    }
  }, [id, appToken, clearSession, router, locale]);

  useEffect(() => {
    if (isHydrated && appToken) {
      loadAlbums(appToken);
      loadAlbum();
    } else if (isHydrated && !appToken) {
      router.push(`/${locale}/login`);
    }
  }, [isHydrated, appToken, loadAlbums, loadAlbum, router, locale]);

  useSupabaseRealtime(appToken ? 'Album' : '', loadAlbum);
  useSupabaseRealtime(appToken ? 'Track' : '', loadAlbum);

  if (loading && !album) {
    return <div className="p-8 text-center animate-pulse">Loading album...</div>;
  }

  if (!album) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4">Album không tồn tại hoặc bạn không có quyền truy cập.</p>
        <Link href={`/${locale}`} className="text-primary underline">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  return (
    <main className="container max-w-2xl mx-auto p-4 md:p-8 space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <Link href={`/${locale}`}>
          <Button variant="ghost" size="sm" className="-ml-2">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t('title')}
            </Button>
            </Link>
            </div>

            <div className="flex items-center space-x-6">
        <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs text-center p-2 shadow-lg">
          {album.coverUrl ? (
            <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover rounded-lg" />
          ) : (
            album.title
          )}
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{album.title}</h1>
          <p className="text-muted-foreground">{album.artist}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('tracks')}</h2>
        <Library 
          onTrackSelect={play} 
          currentTrackId={currentTrack?.id} 
          albumId={id}
        />
      </div>
    </main>
  );
}
