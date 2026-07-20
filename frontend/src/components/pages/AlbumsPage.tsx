'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { fetchAlbums, createAlbum } from '@/lib/api';
import { useAlbumStore } from '@/store/useAlbumStore';
import { useAuthStore } from '@/store/useAuthStore';
import { AlbumsTemplate } from '@/components/templates/Albums/AlbumsTemplate';
import { toast } from 'sonner';

interface AlbumsPageProps {
  locale: string;
}

export function AlbumsPage({ locale }: AlbumsPageProps) {
  const t = useTranslations('Music');
  const { accessToken: appToken, isHydrated } = useAuthStore();
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
      setAlbums(Array.isArray(result) ? result : []);
    } catch (err: any) {
      console.error('Failed to load albums:', err);
      toast.error(err.message || t('error_loading') || 'Failed to load albums');
    }
  }, [appToken, setAlbums]);

  useEffect(() => {
    if (isHydrated && appToken) {
      loadAlbums();
    }
  }, [isHydrated, appToken, loadAlbums]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !appToken) return;
    try {
      const newAlbum = await createAlbum(appToken, { title: newTitle, artist: newArtist });
      setAlbums([...(Array.isArray(albums) ? albums : []), newAlbum]);
      setIsCreating(false);
      setNewTitle('');
      setNewArtist('');
    } catch (err: any) {
      console.error('Failed to create album', err);
      toast.error(err.message || t('error_creating') || 'Failed to create album');
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
