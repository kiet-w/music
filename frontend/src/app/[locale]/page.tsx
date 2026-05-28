'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Music } from 'lucide-react';
import dynamic from 'next/dynamic';
import { fetchAlbums } from '@/lib/api';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';

const PlaylistGrid = dynamic(() => import('@/components/molecules/Playlist/PlaylistGrid').then(mod => mod.PlaylistGrid), {
  loading: () => <div className="h-48 bg-muted animate-pulse rounded-xl w-full" />,
  ssr: false,
});

interface Album {
  id: string;
  title: string;
  artist: string | null;
  coverUrl: string | null;
  _count?: {
    songs: number;
  };
}

export default function HomePage({ params: { locale } }: { params: { locale: string } }) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAlbums = useCallback(() => {
    fetchAlbums()
      .then(setAlbums)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);

  useSupabaseRealtime('Album', loadAlbums);

  const { processedAlbums, totalSongs } = React.useMemo(() => {
    const total = albums.reduce((acc, album) => acc + (album._count?.songs || 0), 0);
    return { processedAlbums: albums, totalSongs: total };
  }, [albums]);

  return (
    <main className="px-6 py-8 pb-32 min-h-[100dvh] max-w-7xl mx-auto space-y-12">
      <section>
        <div className="flex items-baseline justify-between mb-8">
          <h1 className="text-3xl font-serif italic tracking-tight">Your Albums</h1>
          <p className="text-[13px] text-muted-foreground font-medium">Collection: {totalSongs} songs</p>
        </div>
        
        {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse flex flex-col gap-2">
              <div className="aspect-square bg-muted rounded-xl"></div>
              <div className="h-4 bg-muted w-3/4 rounded"></div>
              <div className="h-3 bg-muted w-1/2 rounded"></div>
            </div>
          ))}
        </div>
      ) : processedAlbums.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {processedAlbums.map((album) => (
            <Link key={album.id} href={`/${locale}/albums/${album.id}`} className="group flex flex-col gap-2">
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
