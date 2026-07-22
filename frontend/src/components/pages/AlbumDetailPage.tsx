'use client';

import React from 'react';
import { AlbumDetailTemplate } from '@/components/templates/AlbumDetail/AlbumDetailTemplate';
import { useAlbumDetail } from '@/hooks/useAlbumDetail';

interface AlbumDetailPageProps {
  locale: string;
}

export function AlbumDetailPage({ locale }: AlbumDetailPageProps) {
  const { album, loading, isAlbumActive, id, currentTrackId, play, t } = useAlbumDetail(locale);

  return (
    <AlbumDetailTemplate 
      album={album}
      loading={loading}
      isAlbumActive={isAlbumActive}
      id={id}
      locale={locale}
      currentTrackId={currentTrackId}
      play={play}
      t={t}
    />
  );
}
