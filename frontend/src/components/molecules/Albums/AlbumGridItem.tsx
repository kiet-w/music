'use client';

import React, { useState } from 'react';
import { DiscAlbum, Play } from 'lucide-react';
import { getMediaUrl } from '@/lib/utils';

interface Album {
  id: string;
  title: string;
  artist: string | null;
  coverUrl: string | null;
  createdAt?: string;
  _count?: {
    songs: number;
  };
}

interface AlbumGridItemProps {
  album: Album;
  index?: number;
  locale?: string;
  t?: (key: string) => string;
  onSelectAlbum?: (album: Album) => void;
}

export function AlbumGridItem({ album, t, onSelectAlbum }: AlbumGridItemProps) {
  const [hasError, setHasError] = useState(false);
  const mediaUrl = getMediaUrl(album.coverUrl);

  const displaySongsText = t ? t('songs') : 'bài hát';
  const displayArtist = album.artist || (album._count?.songs !== undefined ? `${album._count.songs} ${displaySongsText}` : '');
  const listenText = t ? (t('listen') || 'Nghe Album') : 'Nghe Album';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSelectAlbum) {
      onSelectAlbum(album);
    }
  };

  return (
    <div className="group relative select-none cursor-pointer" onClick={handleClick}>
      <div className="flex flex-col gap-3 focus:outline-none">
        {/* Ambient Diffusion Shadow Glow Behind Container */}
        <div className="relative">
          <div className="absolute inset-0 rounded-[2.5rem] bg-white/10 blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />

          {/* Main Album Card Container */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-950 flex items-center justify-center border border-white/10 group-hover:border-white/25 transition-all duration-500 ease-out shrink-0 aspect-square w-full shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] group-hover:scale-[1.03] active:scale-[0.98]">
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
              <div className="flex flex-col items-center justify-center gap-3 p-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:text-white/80 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                  <DiscAlbum size={24} strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 group-hover:text-white/70 transition-colors duration-300 truncate max-w-[110px]">
                  {album.title}
                </span>
              </div>
            )}

            {/* Studio Vignette Overlay on Hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-lg flex items-center gap-1.5 group-hover:scale-105 transition-transform duration-300">
                <Play className="w-3 h-3 fill-white text-white" />
                {listenText}
              </span>
            </div>
          </div>
        </div>

        {/* Text Metadata Section */}
        <div className="space-y-0.5 flex-1 min-w-0 px-1">
          <h3 className="text-xs sm:text-sm font-bold font-instrument tracking-tight truncate text-white group-hover:text-white/90 transition-colors leading-tight">
            {album.title}
          </h3>
          {displayArtist && (
            <p className="text-[11px] sm:text-xs text-zinc-400 font-medium truncate">
              {displayArtist}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AlbumGridItem;
