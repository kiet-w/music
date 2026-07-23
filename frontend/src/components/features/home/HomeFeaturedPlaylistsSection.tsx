'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { AlbumGridItem } from '@/components/features/albums/grid/AlbumGridItem';

interface AlbumItem {
  id: string;
  title: string;
  artist?: string | null;
  coverUrl?: string | null;
  createdAt?: string;
  _count?: { songs: number };
}

interface HomeFeaturedPlaylistsSectionProps {
  locale: string;
  albums: AlbumItem[];
}

export function HomeFeaturedPlaylistsSection({
  locale,
  albums
}: HomeFeaturedPlaylistsSectionProps) {
  const defaultTranslator = (key: string) => (key === 'songs' ? 'bài hát' : key);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-instrument text-2xl font-normal text-white">Bộ Sưu Tập & Playlist Nổi Bật</h2>
          <p className="text-xs text-zinc-400">Tuyển tập album cá nhân và playlist phổ biến</p>
        </div>
        <Link href={`/${locale}/albums`} className="text-xs text-white/80 hover:text-white transition-colors flex items-center gap-1 font-medium">
          <span>Xem tất cả</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="flex items-center gap-5 overflow-x-auto pb-4 scrollbar-hide">
        {albums && albums.length > 0 ? (
          albums.map((album, index) => (
            <div key={album.id} className="min-w-[170px] w-[170px] sm:min-w-[190px] sm:w-[190px] shrink-0">
              <AlbumGridItem 
                album={{
                  id: album.id,
                  title: album.title,
                  artist: album.artist || null,
                  coverUrl: album.coverUrl || null,
                  createdAt: album.createdAt || new Date().toISOString(),
                  _count: album._count
                }} 
                index={index} 
                locale={locale} 
                t={defaultTranslator} 
              />
            </div>
          ))
        ) : (
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="min-w-[170px] w-[170px] sm:min-w-[190px] sm:w-[190px] shrink-0">
              <AlbumGridItem 
                album={{
                  id: `mock-${i}`,
                  title: `Studio Playlist #${i}`,
                  artist: 'Various Artists',
                  coverUrl: `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80&sig=${i}`,
                  createdAt: new Date().toISOString(),
                  _count: { songs: 5 }
                }} 
                index={i} 
                locale={locale} 
                t={defaultTranslator} 
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
