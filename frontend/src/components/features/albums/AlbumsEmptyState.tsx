'use client';

import React from 'react';
import { Plus, DiscAlbum } from 'lucide-react';

interface AlbumsEmptyStateProps {
  onCreateClick: () => void;
  t: (key: string) => string;
}

export function AlbumsEmptyState({ onCreateClick, t }: AlbumsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
        <DiscAlbum className="w-20 h-20 relative z-10 text-muted-foreground/20" />
      </div>
      <h2 className="text-2xl font-instrument tracking-tight text-foreground mb-3">{t('no_albums_yet')}</h2>
      <p className="text-base text-muted-foreground leading-relaxed max-w-[260px] mx-auto font-sans mb-10">
        Organize your library by creating your first custom album.
      </p>
      <button 
        onClick={onCreateClick}
        className="flex items-center gap-3 bg-foreground text-background rounded-full px-10 py-4 font-semibold hover:opacity-95 transition-all active:scale-95 shadow-[0_20px_40px_rgba(0,0,0,0.1)] group">
        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
        {t('create_first_album')}
      </button>
    </div>
  );
}
