'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { fetchAlbums, createAlbum } from '@/lib/api';
import { useAlbumStore } from '@/store/useAlbumStore';
import { useAuthStore } from '@/store/useAuthStore';

export function useAlbums(locale: string) {
  const t = useTranslations('Music');
  const router = useRouter();
  const { accessToken: appToken, isHydrated } = useAuthStore();
  const { albums, setAlbums, isLoading } = useAlbumStore();

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
  }, [appToken, setAlbums, t]);

  useEffect(() => {
    if (isHydrated && appToken) {
      void loadAlbums();
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
      console.error('Failed to create album:', err);
      toast.error(err.message || t('error_creating') || 'Failed to create album');
    }
  };

  const onImportClick = () => {
    router.push(`/${locale}/music?tab=drive`);
  };

  return {
    albums: Array.isArray(albums) ? albums : [],
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
  };
}
