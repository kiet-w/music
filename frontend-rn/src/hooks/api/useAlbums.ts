
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { fetchAlbums, createAlbum, uploadImage } from '@/lib/api';
import { useAlbumStore } from '@/store/useAlbumStore';
import { useAuthStore } from '@/store/useAuthStore';

export function useAlbums(locale: string) {
  const t = (key: string) => key;
  const router = useRouter();
  const { accessToken: appToken, isHydrated } = useAuthStore();
  const { albums, setAlbums, isLoading } = useAlbumStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const loadAlbums = useCallback(async () => {
    if (!appToken) return;
    try {
      const result = await fetchAlbums(appToken, { cache: 'no-store' });
      setAlbums(Array.isArray(result) ? result : []);
    } catch (err: any) {
      console.error('Failed to load albums:', err);
      Alert.alert(err.message || 'error_loading' || 'Failed to load albums');
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
      let finalCoverUrl: string | undefined = undefined;
      
      if (coverFile) {
        const uploadResult = await uploadImage(appToken, coverFile, 'covers');
        finalCoverUrl = uploadResult.url;
      }

      const newAlbum = await createAlbum(appToken, { 
        title: newTitle.trim(), 
        artist: newArtist.trim() || undefined,
        coverUrl: finalCoverUrl 
      });

      setAlbums([newAlbum, ...(Array.isArray(albums) ? albums : [])]);
      setIsCreating(false);
      setNewTitle('');
      setNewArtist('');
      setCoverFile(null);
      setCoverUrl(null);
      Alert.alert(`Đã tạo album "${newAlbum.title}" thành công!`);
    } catch (err: any) {
      console.error('Failed to create album:', err);
      Alert.alert(err.message || 'error_creating' || 'Failed to create album');
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
    coverFile,
    setCoverFile,
    coverUrl,
    setCoverUrl,
    handleCreate,
    onImportClick,
    t,
  };
}
