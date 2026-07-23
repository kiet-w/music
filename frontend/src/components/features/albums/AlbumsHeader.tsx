'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Plus, LayoutGrid, List, HardDrive } from 'lucide-react';

interface AlbumsHeaderProps {
  albumsCount: number;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  onImportClick: () => void;
  onCreateClick: () => void;
  t: (key: string, values?: any) => string;
}

export function AlbumsHeader({ 
  albumsCount, 
  viewMode, 
  setViewMode, 
  onImportClick, 
  onCreateClick, 
  t 
}: AlbumsHeaderProps) {
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-6 mb-6 mt-2">
      {/* Breadcrumb: Album / Trang chủ */}
      <div className="flex items-center gap-3">
        <h1 className="font-instrument text-4xl sm:text-5xl tracking-tighter leading-none">{t('albums')}</h1>
        <span className="text-white/30 text-3xl sm:text-4xl font-light select-none">/</span>
        <Link 
          href={`/${locale}`} 
          className="font-instrument text-4xl sm:text-5xl tracking-tighter leading-none text-white/70 hover:text-white transition-colors duration-200"
        >
          Trang chủ
        </Link>
      </div>
      <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground font-sans">
            {albumsCount > 0 ? t('collection_count', { count: albumsCount }) : 'Your music library'}
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-add-music-popup'))}
              className="flex items-center gap-2 bg-foreground text-background rounded-full px-4 h-10 hover:opacity-90 transition-all active:scale-95 text-xs font-bold uppercase tracking-wider shadow-lg shadow-foreground/10 cursor-pointer">
              <Plus size={18} strokeWidth={2} />
              <span>Convert / Thêm Nhạc</span>
            </button>
            <button 
              onClick={onCreateClick}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-full px-4 h-10 transition-all active:scale-95 text-xs font-bold uppercase tracking-wider border border-white/10 cursor-pointer">
              <Plus size={18} strokeWidth={2} />
              <span>{t('create')}</span>
            </button>
          </div>
        </div>
      
      {albumsCount > 0 && (
        <div className="flex justify-end items-center border-b border-border/50 pb-4">
          <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50 backdrop-blur-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm font-medium ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid size={16} strokeWidth={1.5} />
              <span>Grid</span>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm font-medium ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List size={16} strokeWidth={1.5} />
              <span>List</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
