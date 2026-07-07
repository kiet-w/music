'use client';

import React from 'react';
import Link from 'next/link';
import { DiscAlbum } from 'lucide-react';
import type { Album } from '@/types/album';

interface AlbumGridItemProps {
  album: Album;
  index: number;
  locale: string;
  t: (key: string) => string;
}

export function AlbumGridItem({ album, index, locale, t }: AlbumGridItemProps) {
  return (
    <div>
      <Link 
        href={`/${locale}/albums/detail?id=${album.id}`} 
        className="group flex flex-col gap-3"
      >
        <div className="relative overflow-hidden rounded-2xl bg-muted flex items-center justify-center border-[0.5px] border-white/10 group-hover:border-white/20 transition-all duration-500 ease-out shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] aspect-[3/4] w-full shadow-sm group-hover:scale-[1.02]">
          {album.coverUrl ? (
            <img src={album.coverUrl} alt={album.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          ) : (
            <DiscAlbum size={40} strokeWidth={1.5} className="text-muted-foreground/30" />
          )}
        </div>
        <div className="space-y-1 flex-1 min-w-0 pr-2">
          <h3 className="text-lg font-medium leading-tight truncate group-hover:text-primary transition-colors">{album.title}</h3>
          <p className="text-sm text-muted-foreground/80 font-sans tracking-wide">
            {album._count?.songs || 0} {t('songs')}
          </p>
        </div>
      </Link>
    </div>
  );
}
