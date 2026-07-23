'use client';

import React from 'react';
import { AlbumsTemplate } from '@/components/features/albums/AlbumsTemplate';
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
    coverUrl,
    setCoverUrl,
    setCoverFile,
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
      coverUrl={coverUrl}
      setCoverUrl={setCoverUrl}
      setCoverFile={setCoverFile}
      handleCreate={handleCreate}
      onImportClick={onImportClick}
      locale={locale}
      t={t}
    />
  );
}

