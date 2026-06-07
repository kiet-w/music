'use client';

import React from 'react';
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
  return (
    <div className="flex flex-col gap-6 mb-12 mt-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-instrument text-4xl md:text-5xl tracking-tighter leading-none">{t('albums')}</h1>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground font-sans">
            {albumsCount > 0 ? t('collection_count', { count: albumsCount }) : 'Your music library'}
          </p>
          <div className="flex gap-2">
            <button 
              onClick={onImportClick}
              className="flex items-center justify-center w-10 h-10 bg-blue-500/10 text-blue-600 rounded-full hover:bg-blue-500/20 transition-all active:scale-95 border border-blue-500/20 shadow-sm"
              title={t('import_from_drive')}>
              <HardDrive size={20} strokeWidth={1.5} />
            </button>
            <button 
              onClick={onCreateClick}
              className="flex items-center gap-2 bg-foreground text-background rounded-full px-4 h-10 hover:opacity-90 transition-all active:scale-95 text-sm font-medium shadow-lg shadow-foreground/10">
              <Plus size={18} strokeWidth={2} />
              <span>{t('create')}</span>
            </button>
          </div>
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
