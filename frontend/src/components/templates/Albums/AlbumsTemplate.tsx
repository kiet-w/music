'use client';

import React from 'react';
import { MainContainer } from '@/components/templates/wrappers/MainContainer';
import { AlbumSkeleton } from '@/components/features/shared/AlbumSkeleton';
import { AlbumsHeader } from '@/components/features/albums/AlbumsHeader';
import { AlbumGridItem } from '@/components/features/albums/grid/AlbumGridItem';
import { AlbumListItem } from '@/components/features/albums/list/AlbumListItem';
import { CreateAlbumDialog } from '@/components/features/albums/dialogs/CreateAlbumDialog';
import { AlbumsEmptyState } from '@/components/features/albums/AlbumsEmptyState';
import { GlobalLoading } from '@/components/atoms/GlobalLoading';

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

import { useKeyboardMode } from '@/hooks/useKeyboardMode';

interface AlbumsTemplateProps {
  albums: Album[];
  isLoading: boolean;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  isCreating: boolean;
  setIsCreating: (value: boolean) => void;
  newTitle: string;
  setNewTitle: (value: string) => void;
  newArtist?: string;
  setNewArtist?: (value: string) => void;
  coverUrl?: string | null;
  setCoverUrl?: (value: string | null) => void;
  setCoverFile?: (file: File | null) => void;
  handleCreate: (e: React.FormEvent) => void;
  onImportClick: () => void;
  locale: string;
  t: (key: string, values?: any) => string;
}

export function AlbumsTemplate({
  albums,
  isLoading,
  viewMode,
  setViewMode,
  isCreating,
  setIsCreating,
  newTitle,
  setNewTitle,
  newArtist,
  setNewArtist,
  coverUrl,
  setCoverUrl,
  setCoverFile,
  handleCreate,
  onImportClick,
  locale,
  t
}: AlbumsTemplateProps) {
  useKeyboardMode('none');
  return (
    <MainContainer className="h-[100dvh] max-h-[100dvh] overflow-hidden !pb-[100px] flex flex-col gap-4">
      <div className="shrink-0">
        <AlbumsHeader 
          albumsCount={albums.length}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onImportClick={onImportClick}
          onCreateClick={() => setIsCreating(true)}
          t={t}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-4 scrollbar-hide">
        {isLoading && albums.length === 0 ? (
          <GlobalLoading />
        ) : albums.length > 0 ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-x-6 gap-y-10 px-1.5" : "flex flex-col gap-4"}>
            {albums.map((album, index) => (
              viewMode === 'grid' ? (
                <AlbumGridItem 
                  key={album.id} 
                  album={album} 
                  index={index} 
                  locale={locale} 
                  t={t} 
                />
              ) : (
                <AlbumListItem 
                  key={album.id} 
                  album={album} 
                  locale={locale} 
                  t={t} 
                />
              )
            ))}
          </div>
        ) : (
          <AlbumsEmptyState 
            onCreateClick={() => setIsCreating(true)} 
            t={t} 
          />
        )}
      </div>

      <CreateAlbumDialog 
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onSubmit={handleCreate}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        newArtist={newArtist}
        setNewArtist={setNewArtist}
        coverUrl={coverUrl}
        setCoverUrl={setCoverUrl}
        onCoverFileSelect={setCoverFile}
        t={t}
      />
    </MainContainer>
  );
}
