'use client';

import React from 'react';
import { AlbumsTemplate } from '@/components/templates/Albums/AlbumsTemplate';
import { useAlbums } from '@/hooks/useAlbums';

interface AlbumsPageProps {
  locale: string;
}

export function AlbumsPage({ locale }: AlbumsPageProps) {
  const {
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
    handleCreate,
    onImportClick,
    t,
  } = useAlbums(locale);

  return (
    <AlbumsTemplate 
      albums={albums}
      isLoading={isLoading}
      viewMode={viewMode}
      setViewMode={setViewMode}
      isCreating={isCreating}
      setIsCreating={setIsCreating}
      newTitle={newTitle}
      setNewTitle={setNewTitle}
      newArtist={newArtist}
      setNewArtist={setNewArtist}
      handleCreate={handleCreate}
      onImportClick={onImportClick}
      locale={locale}
      t={t}
    />
  );
}

