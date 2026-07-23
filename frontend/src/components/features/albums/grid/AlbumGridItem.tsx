'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DiscAlbum } from 'lucide-react';
import { getMediaUrl } from '@/lib/utils';

interface Album {
  id: string;
  title: string;
  artist: string | null;
  coverUrl: string | null;
  createdAt: string;
  _count?: {
    songs: number;
  };
}

interface AlbumGridItemProps {
  album: Album;
  index: number;
  locale: string;
  t: (key: string) => string;
}

export function AlbumGridItem({ album, index, locale, t }: AlbumGridItemProps) {
  const [hasError, setHasError] = useState(false);
  const mediaUrl = getMediaUrl(album.coverUrl);

  return (
    <div>
      <Link 
        href={`/${locale}/albums/detail?id=${album.id}`} 
        className="group flex flex-col gap-3"
      >
        <div className="relative overflow-hidden rounded-2xl bg-white/5 flex items-center justify-center border-[0.5px] border-white/10 group-hover:border-white/20 transition-all duration-500 ease-out shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] aspect-square w-full shadow-sm group-hover:scale-[1.02]">
          {mediaUrl && !hasError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={mediaUrl} 
              alt={album.title} 
              loading="lazy" 
              onError={() => setHasError(true)}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
              <DiscAlbum size={44} strokeWidth={1.2} className="text-white/20 group-hover:text-emerald-400/60 transition-colors" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/30 truncate max-w-[100px]">{album.title}</span>
            </div>
          )}
        </div>
        <div className="space-y-1 flex-1 min-w-0 pr-2">
          <h3 className="text-base font-bold leading-tight truncate text-white group-hover:text-emerald-400 transition-colors">{album.title}</h3>
          <p className="text-xs text-white/40 font-sans tracking-wide">
            {album._count?.songs || 0} {t('songs')}
          </p>
        </div>
      </Link>
    </div>
  );
}
