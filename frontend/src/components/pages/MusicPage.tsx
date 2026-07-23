'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useDownloadHistoryStore } from '@/store/useDownloadHistoryStore';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { useAlbumStore } from '@/store/useAlbumStore';
import { useAuthStore } from '@/store/useAuthStore';
import { MusicTemplate } from '@/components/features/music/MusicTemplate';
import { GlobalLoading } from '@/components/atoms/GlobalLoading';

export function MusicPage() {
  const t = useTranslations('Music');
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'drive' ? 'drive' : 'youtube';
  const shouldOpenPicker = searchParams.get('openPicker') === 'true';
  
  const { historyByUserId } = useDownloadHistoryStore();
  const { login, checkConnection, openPicker, isConnected, isLoading: isDriveLoading } = useGoogleDrive();
  const { albums, loadAlbums } = useAlbumStore();
  const { accessToken: appToken, user } = useAuthStore();
  
  const history = user ? (historyByUserId[user.id] || []) : [];
  
  const [activeTab, setActiveTab] = useState<'youtube' | 'drive'>(initialTab);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>("");
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  // Sync tab with search params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'drive') {
      setActiveTab('drive');
    } else if (tab === 'youtube') {
      setActiveTab('youtube');
    }
  }, [searchParams]);

  // Load albums and drive files when switching to drive tab
  useEffect(() => {
    if (activeTab === 'drive' && appToken) {
      loadAlbums(appToken);
      checkConnection(appToken);
    }
  }, [activeTab, appToken, loadAlbums, checkConnection]);

  // Auto-open picker if shouldOpenPicker is true and we are connected
  useEffect(() => {
    if (shouldOpenPicker && isConnected && appToken) {
      openPicker(appToken, selectedAlbumId);
    }
  }, [shouldOpenPicker, isConnected, appToken, openPicker, selectedAlbumId]);

  // Set default album
  useEffect(() => {
    if (albums.length > 0 && !selectedAlbumId) {
      setSelectedAlbumId(albums[0].id);
    }
  }, [albums, selectedAlbumId]);

  const handleBrowseDrive = async () => {
    if (!appToken) return;
    
    setIsCheckingConnection(true);
    try {
      const connected = await checkConnection(appToken);
      
      if (connected) {
        await openPicker(appToken, selectedAlbumId);
      } else {
        login(appToken);
      }
    } catch (err) {
      console.error('Drive browse failed:', err);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  return (
    <>
      {(isCheckingConnection || isDriveLoading) && (
        <GlobalLoading fullScreen message={t('loading') || 'Đang xử lý...'} />
      )}
      <MusicTemplate 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onBrowseDrive={handleBrowseDrive}
        isCheckingConnection={isCheckingConnection}
        isDriveLoading={isDriveLoading}
        selectedAlbumId={selectedAlbumId}
        setSelectedAlbumId={setSelectedAlbumId}
        albums={albums}
        history={history}
        t={t}
      />
    </>
  );
}
