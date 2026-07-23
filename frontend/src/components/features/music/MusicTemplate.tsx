'use client';

import React from 'react';
import { MainContainer } from '@/components/templates/wrappers/MainContainer';
import { MusicTabSwitcher } from '@/components/features/music/MusicTabSwitcher';
import { YoutubeSection } from '@/components/features/music/youtube/YoutubeSection';
import { DriveSection } from '@/components/features/music/drive/DriveSection';
import { DownloadHistoryList } from '@/components/features/music/history/DownloadHistoryList';
import { AnimatePresence } from 'framer-motion';

interface Album {
  id: string;
  title: string;
}

interface HistoryItem {
  id: string;
  title: string;
  artist?: string;
  albumTitle: string;
}

interface MusicTemplateProps {
  activeTab: 'youtube' | 'drive';
  setActiveTab: (tab: 'youtube' | 'drive') => void;
  onBrowseDrive: () => void;
  isCheckingConnection: boolean;
  isDriveLoading: boolean;
  selectedAlbumId: string;
  setSelectedAlbumId: (id: string) => void;
  albums: Album[];
  history: HistoryItem[];
  t: (key: string, values?: any) => string;
}

import { useKeyboardMode } from '@/hooks/useKeyboardMode';
import { GlobalLoading } from '@/components/atoms/GlobalLoading';

export function MusicTemplate({
  activeTab,
  setActiveTab,
  onBrowseDrive,
  isCheckingConnection,
  isDriveLoading,
  selectedAlbumId,
  setSelectedAlbumId,
  albums,
  history,
  t
}: MusicTemplateProps) {
  useKeyboardMode('none');
  return (
    <MainContainer>
      {(isCheckingConnection || isDriveLoading) && (
        <GlobalLoading fullScreen message={t('loading') || 'Đang xử lý...'} />
      )}
      <div className="flex flex-col gap-2 mb-6 mt-2">
        <h1 className="font-instrument text-4xl sm:text-5xl tracking-tighter leading-none">{t('add_music')}</h1>
        <p className="text-base text-muted-foreground leading-relaxed font-sans">
          {activeTab === 'youtube' ? 'Convert YouTube to MP3.' : 'Import MP3s from your Drive.'}
        </p>
      </div>

      <MusicTabSwitcher activeTab={activeTab} setActiveTab={setActiveTab} />

      <AnimatePresence mode="wait">
        {activeTab === 'youtube' ? (
          <YoutubeSection />
        ) : (
          <DriveSection 
            onBrowseClick={onBrowseDrive}
            isCheckingConnection={isCheckingConnection}
            isDriveLoading={isDriveLoading}
            selectedAlbumId={selectedAlbumId}
            setSelectedAlbumId={setSelectedAlbumId}
            albums={albums}
            t={t}
          />
        )}
      </AnimatePresence>

      {activeTab === 'youtube' && (
        <DownloadHistoryList history={history} t={t} />
      )}
    </MainContainer>
  );
}
