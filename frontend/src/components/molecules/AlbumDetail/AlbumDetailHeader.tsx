'use client';

import React from 'react';
import { Disc } from 'lucide-react';

interface Album {
  id: string;
  title: string;
  artist: string | null;
  coverUrl: string | null;
}

interface AlbumDetailHeaderProps {
  album: Album;
  isAlbumActive: boolean;
}

export function AlbumDetailHeader({ album, isAlbumActive }: AlbumDetailHeaderProps) {
  return (
    <div className="flex items-center space-x-6">
      <div 
        className="w-32 h-32 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground text-xs text-center p-2 shadow-xl border border-border overflow-hidden relative"
      >
        {album.coverUrl ? (
          <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
        ) : (
          <Disc className="w-12 h-12 opacity-20" />
        )}
        {isAlbumActive && (
          <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px] flex items-center justify-center">
            <div className="flex gap-1 items-end h-4">
              {[0.4, 0.7, 0.5, 0.9].map((h, i) => (
                <div 
                  key={i}
                  className="w-1 bg-primary rounded-full animate-pulse"
                  style={{ height: `${h * 100}%` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          {album.title}
        </h1>
        <p className="text-muted-foreground">
          {album.artist || 'Various Artists'}
        </p>
      </div>
    </div>
  );
}
