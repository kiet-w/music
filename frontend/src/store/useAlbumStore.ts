'use client';

import { create } from 'zustand';
import { fetchAlbums } from '@/lib/api';

interface AlbumStore {
  albums: any[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  loadAlbums: (accessToken?: string) => Promise<void>;
  setAlbums: (albums: any[]) => void;
  reset: () => void;
}

export const useAlbumStore = create<AlbumStore>((set, get) => ({
  albums: [],
  isLoading: false,
  isLoaded: false,
  error: null,
  loadAlbums: async (accessToken) => {
    // Avoid redundant fetches if already loaded
    if (get().isLoaded) return;
    
    set({ isLoading: true, error: null });
    try {
      const result = await fetchAlbums(accessToken as string);
      set({ albums: Array.isArray(result) ? result : [], isLoaded: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load albums';
      console.error('Failed to load albums', error);
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },
  setAlbums: (albums) => set({ albums, isLoaded: true }),
  reset: () => set({ albums: [], isLoading: false, isLoaded: false, error: null }),
}));
