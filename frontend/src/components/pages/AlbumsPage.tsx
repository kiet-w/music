'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { fetchAlbums, createAlbum } from '@/lib/api';
import { useAlbumStore } from '@/store/useAlbumStore';
import { useAuthStore } from '@/store/useAuthStore';
import { AlbumsTemplate } from '@/components/templates/Albums/AlbumsTemplate';

interface AlbumsPageProps {
  locale: string;
}

export function AlbumsPage({ locale }: AlbumsPageProps) {
  const t = useTranslations('Music');
  const { accessToken: appToken, isHydrated, clearSession } = useAuthStore();
  const { albums, setAlbums, isLoading } = useAlbumStore();
  const router = useRouter();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');

  const loadAlbums = useCallback(async () => {
    if (!appToken) return;
    try {
      const result = await fetchAlbums(appToken, { cache: 'no-store' });
      const data = result.data ? result.data : result;
      setAlbums(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load albums:', err);
      if (err.message?.includes('401') || err.message?.toLowerCase()?.includes('unauthorized')) {
        clearSession();
        router.push(`/${locale}/login`);
      }
    }
  }, [appToken, setAlbums, clearSession, router, locale]);

  useEffect(() => {
    if (isHydrated && appToken) {
      loadAlbums();
    }
  }, [isHydrated, appToken, loadAlbums]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !appToken) return;
    try {
      const result = await createAlbum(appToken, { title: newTitle, artist: newArtist });
      const newAlbum = result.data ? result.data : result;
      setAlbums([...(Array.isArray(albums) ? albums : []), newAlbum]);
      setIsCreating(false);
      setNewTitle('');
      setNewArtist('');
    } catch (err: any) {
      console.error('Failed to create album', err);
      if (err.message?.includes('401') || err.message?.toLowerCase()?.includes('unauthorized')) {
        clearSession();
        router.push(`/${locale}/login`);
      }
    }
  };

  const onImportClick = () => {
    router.push(`/${locale}/music?tab=drive`);
  };

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
