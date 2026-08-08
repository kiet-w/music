
import { useState, useCallback, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { fetchAlbum } from '@/lib/api';
import { useAlbumStore } from '@/store/useAlbumStore';
import { useAuthStore } from '@/store/useAuthStore';
import { usePlayerStore } from '@/store/usePlayerStore';

export function useAlbumDetail(locale: string) {
  const { accessToken: appToken, isHydrated } = useAuthStore();
  const t = (key: string) => key;
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const id = (searchParams.id as string) || '';
  const { play, currentTrack, isPlaying } = usePlayerStore();
  const [album, setAlbum] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { loadAlbums } = useAlbumStore();

  const loadAlbum = useCallback(async () => {
    if (!appToken) return;
    try {
      const data = await fetchAlbum(appToken, id);
      setAlbum(data);
    } catch (err: any) {
      console.error('Failed to reload album:', err);
      Alert.alert(err.message || 'Failed to load album details');
    } finally {
      setLoading(false);
    }
  }, [id, appToken]);

  useEffect(() => {
    if (isHydrated && appToken) {
      void loadAlbums(appToken);
      void loadAlbum();
    } else if (isHydrated && !appToken) {
      router.push(`/${locale}/login`);
    }
  }, [isHydrated, appToken, loadAlbums, loadAlbum, router, locale]);



  const isAlbumActive = currentTrack?.albumId === id && isPlaying;

  return {
    album,
    loading,
    t,
    play,
    currentTrack,
    currentTrackId: currentTrack?.id,
    isPlaying,
    isAlbumActive,
    id,
    router,
    appToken,
  };
}
