'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/atoms/ui/button';
import { MainContainer } from '@/components/templates/wrappers/MainContainer';
import { AlbumDetailHeader } from '@/components/molecules/AlbumDetail/AlbumDetailHeader';

const Library = dynamic(() => import('@/components/molecules/Library/Library'), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-muted-foreground animate-pulse">Loading tracks...</div>
});

interface Album {
  id: string;
  title: string;
  artist: string | null;
  coverUrl: string | null;
  _count?: {
    songs: number;
  };
}

interface AlbumDetailTemplateProps {
  album: Album | null;
  loading: boolean;
  isAlbumActive: boolean;
  id: string;
  locale: string;
  currentTrackId?: string;
  play: (track: any) => void;
  t: (key: string) => string;
}

export function AlbumDetailTemplate({
  album,
  loading,
  isAlbumActive,
  id,
  locale,
  currentTrackId,
  play,
  t
}: AlbumDetailTemplateProps) {
  if (loading && !album) {
    return <div className="p-8 text-center animate-pulse">Loading album...</div>;
  }

  if (!album) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4">Album không tồn tại hoặc bạn không có quyền truy cập.</p>
        <Link href={`/${locale}`} className="text-primary underline">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  return (
    <MainContainer className="space-y-8">
      <div className="flex items-center justify-between">
        <Link href={`/${locale}/albums`}>
          <Button variant="ghost" size="sm" shape="full" className="-ml-2 bg-muted/50 hover:bg-muted">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t('albums')}
          </Button>
        </Link>
      </div>

      <AlbumDetailHeader album={album} isAlbumActive={isAlbumActive} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">{t('tracks')}</h2>
          <span className="text-sm text-muted-foreground font-sans">
            {album._count?.songs || 0} tracks
          </span>
        </div>
        <Library 
          onTrackSelect={play} 
          currentTrackId={currentTrackId} 
          albumId={id}
        />
      </div>
    </MainContainer>
  );
}
