'use client';

import React, { useEffect, useState } from 'react';
import { HomeTemplate } from '@/components/features/home/HomeTemplate';
import { useAlbumStore } from '@/store/useAlbumStore';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchTracks } from '@/lib/api';

interface HomePageProps {
  locale: string;
}

export function HomePage({ locale }: HomePageProps) {
  const { albums, loadAlbums } = useAlbumStore();
  const { accessToken } = useAuthStore();
  const [realTracks, setRealTracks] = useState<any[]>([]);

  useEffect(() => {
    if (accessToken) {
      loadAlbums(accessToken);
      fetchTracks(accessToken).then((tracks) => {
        if (tracks && Array.isArray(tracks)) {
          setRealTracks(tracks);
        }
      }).catch((err) => {
        console.error('Failed to fetch real tracks for home:', err);
      });
    }
  }, [accessToken, loadAlbums]);

  return (
    <HomeTemplate 
      locale={locale} 
      albums={albums}
      realTracks={realTracks}
    />
  );
}
