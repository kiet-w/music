'use client';

import React, { useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Music } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { fetchAlbums } from '@/lib/api';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { useAlbumStore } from '@/store/useAlbumStore';
import { useAuthStore } from '@/store/useAuthStore';
import { MainContainer } from '@/components/layout/MainContainer';
import { AlbumSkeleton } from '@/components/atoms/AlbumSkeleton';

interface Album {
  id: string;
  title: string;
  artist: string | null;
  coverUrl: string | null;
  _count?: {
    songs: number;
  };
}

export default function HomePageClient({ 
  locale
}: { 
  locale: string; 
}) {
  const t = useTranslations('Music');
  const { albums, setAlbums, isLoading } = useAlbumStore();
  const { accessToken, isHydrated, clearSession } = useAuthStore();
  const router = useRouter();

  const loadAlbums = useCallback(() => {
    if (!accessToken) return;
    
    fetchAlbums(accessToken, { cache: 'no-store' })
      .then(setAlbums)
      .catch(err => {
        console.error('Failed to load albums:', err);
        if (err.message?.includes('401') || err.message?.toLowerCase()?.includes('unauthorized')) {
          clearSession();
          router.push(`/${locale}/login`);
        }
      });
  }, [setAlbums, accessToken, clearSession, router, locale]);

  useEffect(() => {
    if (isHydrated && accessToken) {
      loadAlbums();
    }
  }, [isHydrated, accessToken, loadAlbums]);

  useSupabaseRealtime(accessToken ? 'Album' : '', loadAlbums);

  const totalSongs = React.useMemo(() => {
    return albums.reduce((acc, album) => acc + (album._count?.songs || 0), 0);
  }, [albums]);

  return (
    <MainContainer>
      <section className="mt-4">
        <div className="flex flex-col gap-2 mb-12">
          <h1 className="font-instrument text-4xl md:text-5xl tracking-tighter leading-none">
            {t('your_albums')}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            {t('collection_count', { count: totalSongs })}
          </p>
        </div>
        
        {isLoading && albums.length === 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={i % 2 === 0 ? "mt-8" : ""}>
                <AlbumSkeleton />
              </div>
            ))}
          </div>
        ) : albums.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10">
            {albums.map((album, index) => (
              <div
                key={album.id}
                className={index % 2 === 1 ? "mt-12" : ""}
              >
                <Link 
                  href={`/${locale}/albums/detail?id=${album.id}`} 
                  className="group flex flex-col gap-3"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted flex items-center justify-center border-[0.5px] border-border group-hover:border-foreground/30 transition-all duration-500 ease-out group-hover:scale-[1.02] shadow-sm">
                    {album.coverUrl ? (
                      <img src={album.coverUrl} alt={album.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 opacity-40">
                        <Music className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 pr-2">
                    <h3 className="text-lg font-medium leading-tight group-hover:text-primary transition-colors line-clamp-1">{album.title}</h3>
                    <p className="text-sm text-muted-foreground/80 font-sans tracking-wide">{album._count?.songs || 0} {t('songs')}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
              <Music className="w-16 h-16 relative z-10 text-muted-foreground/20" />
            </div>
            <h2 className="text-xl font-medium text-foreground mb-2">{t('no_albums_yet')}</h2>
            <p className="text-base text-muted-foreground leading-relaxed max-w-[240px] mx-auto font-sans">
              Start building your collection by adding music from YouTube or Drive.
            </p>
          </div>
        )}
      </section>
    </MainContainer>
  );
}
