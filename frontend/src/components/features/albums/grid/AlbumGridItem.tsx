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

// ponytail: tactile monochromatic album grid item card (AWWWARDS Studio Design)
export function AlbumGridItem({ album, index, locale, t }: AlbumGridItemProps) {
  const [hasError, setHasError] = useState(false);
  const mediaUrl = getMediaUrl(album.coverUrl);

  const displayArtist = album.artist || (album._count?.songs !== undefined ? `${album._count.songs} ${t('songs')}` : '');

  return (
    <div>
      <Link 
        href={`/${locale}/albums/detail?id=${album.id}`} 
        className="group flex flex-col gap-3"
      >
        <div className="relative overflow-hidden rounded-[2rem] bg-zinc-900 flex items-center justify-center border border-white/10 group-hover:border-white/30 transition-all duration-500 ease-out shrink-0 aspect-square w-full shadow-xl group-hover:scale-[1.03] group-hover:shadow-2xl">
          {mediaUrl && !hasError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={mediaUrl} 
              alt={album.title} 
              loading="lazy" 
              onError={() => setHasError(true)}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
              <DiscAlbum size={40} strokeWidth={1.2} className="text-white/30 group-hover:text-white transition-colors duration-300" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 truncate max-w-[90px]">{album.title}</span>
            </div>
          )}

          {/* Vignette Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
              Nghe Album
            </span>
          </div>
        </div>

        <div className="space-y-0.5 flex-1 min-w-0 px-1">
          <h3 className="text-xs sm:text-sm font-bold font-instrument tracking-tight truncate text-white group-hover:text-white/90 transition-colors">
            {album.title}
          </h3>
          {displayArtist && (
            <p className="text-[11px] sm:text-xs text-zinc-400 font-medium truncate">
              {displayArtist}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
