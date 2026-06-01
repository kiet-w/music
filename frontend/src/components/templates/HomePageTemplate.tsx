'use client';

import React, { useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Music } from 'lucide-react';
import { fetchAlbums } from '@/lib/api';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { useAlbumStore } from '@/store/useAlbumStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

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
  const { albums, setAlbums, isLoading } = useAlbumStore();
  const { accessToken, isHydrated, clearSession } = useAuthStore();
  const router = useRouter();

  const loadAlbums = useCallback(() => {
    if (!accessToken) return;
    
    // We use { cache: 'no-store' } here because this is a client-side refresh 
    // triggered by realtime events, and we want the absolute latest.
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

  // Fetch only when hydrated and token exists
  useEffect(() => {
    if (isHydrated && accessToken) {
      loadAlbums();
    }
  }, [isHydrated, accessToken, loadAlbums]);

  // Delay realtime subscription until token exists
  useSupabaseRealtime(accessToken ? 'Album' : '', loadAlbums);

  const totalSongs = React.useMemo(() => {
    return albums.reduce((acc, album) => acc + (album._count?.songs || 0), 0);
  }, [albums]);

  return (
    <main className="px-6 py-8 pb-32 min-h-[100dvh] max-w-7xl mx-auto space-y-12">
      <section>
        <div className="flex items-baseline justify-between mb-8">
          <h1 className="text-3xl font-serif italic tracking-tight">Your Albums</h1>
          <p className="text-[13px] text-muted-foreground font-medium">Collection: {totalSongs} songs</p>
        </div>
        
        {isLoading && albums.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse flex flex-col gap-2">
              <div className="aspect-square bg-muted rounded-xl"></div>
              <div className="h-4 bg-muted w-3/4 rounded"></div>
              <div className="h-3 bg-muted w-1/2 rounded"></div>
            </div>
          ))}
        </div>
      ) : albums.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {albums.map((album) => (
            <Link key={album.id} href={`/${locale}/albums/detail?id=${album.id}`} className="group flex flex-col gap-2">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-muted flex items-center justify-center border-[0.5px] border-border group-hover:border-foreground/30 transition-colors duration-200">
                {album.coverUrl ? (
                  <img src={album.coverUrl} alt={album.title} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-0.5">
                <h3 className="text-[15px] font-medium leading-tight truncate group-hover:text-primary transition-colors">{album.title}</h3>
                <p className="text-[13px] text-muted-foreground truncate">{album._count?.songs || 0} songs</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <Music className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-[15px]">Chưa có gì ở đây. Hãy nghe nhạc thôi!</p>
        </div>
      )}
      </section>
    </main>
  );
}
