'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Music } from 'lucide-react';
import { fetchAlbums } from '@/lib/api';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { PageHeader } from '@/components/molecules/Common/PageHeader';
import { AlbumGrid } from '@/components/molecules/Album/AlbumGrid';
import { EmptyState } from '@/components/molecules/Common/EmptyState';
import { PlaylistGrid } from '@/components/molecules/Playlist/PlaylistGrid';

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

  const { totalSongs } = React.useMemo(() => {
    if (!Array.isArray(albums)) return { totalSongs: 0 };
    const total = albums.reduce((acc, album) => acc + (album._count?.songs || 0), 0);
    return { totalSongs: total };
  }, [albums]);

  return (
    <main className="px-6 py-8 pb-32 min-h-[100dvh] max-w-7xl mx-auto space-y-12">
      <section>
        <PageHeader 
          title="Your Playlists" 
          description="Curated for your mood"
        />
        <PlaylistGrid />
      </section>

      <section>
        <PageHeader 
          title="Your Albums" 
          description={`Collection: ${totalSongs} songs`}
        />
        
        {loading || albums.length > 0 ? (
          <AlbumGrid 
            albums={albums} 
            locale={locale} 
            loading={loading} 
          />
        ) : (
          <EmptyState 
            icon={Music} 
            title="Chưa có gì ở đây. Hãy nghe nhạc thôi!" 
          />
        )}
      </section>
    </main>
  );
}
