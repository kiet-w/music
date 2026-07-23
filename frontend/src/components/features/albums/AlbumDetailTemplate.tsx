'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MainContainer } from '@/components/templates/wrappers/MainContainer';
import { AlbumDetailHeader } from '@/components/features/albums/AlbumDetailHeader';

import { GlobalLoading } from '@/components/atoms/GlobalLoading';

const Library = dynamic(() => import('@/components/features/music/player/Library'), {
  ssr: false,
  loading: () => <GlobalLoading />
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

// ponytail: unified album detail page template structure
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
    return <GlobalLoading />;
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
    <MainContainer className="flex-1 min-h-0 flex flex-col gap-4">
      <div className="flex items-center justify-between shrink-0">
        <Link href={`/${locale}/albums`}>
          <Button variant="ghost" size="sm" shape="full" className="-ml-2 bg-muted/50 hover:bg-muted">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t('albums')}
          </Button>
        </Link>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pr-1 scrollbar-hide pb-4">
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
      </div>
    </MainContainer>
  );
}
