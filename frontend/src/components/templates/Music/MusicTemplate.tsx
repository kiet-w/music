'use client';

import React from 'react';
import { MainContainer } from '@/components/templates/wrappers/MainContainer';
import { MusicTabSwitcher } from '@/components/molecules/Music/MusicTabSwitcher';
import { YoutubeSection } from '@/components/molecules/Music/YoutubeSection';
import { DriveSection } from '@/components/molecules/Music/DriveSection';
import { DownloadHistoryList } from '@/components/molecules/Music/DownloadHistoryList';
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
  return (
    <MainContainer>
      <div className="flex flex-col gap-2 mb-8 mt-4">
        <h1 className="font-instrument text-4xl md:text-5xl tracking-tighter leading-none">{t('add_music')}</h1>
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
