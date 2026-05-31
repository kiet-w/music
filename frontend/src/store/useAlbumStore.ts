'use client';

import { create } from 'zustand';
import { fetchAlbums } from '@/lib/api';

interface AlbumStore {
  albums: any[];
  isLoading: boolean;
  isLoaded: boolean;
  loadAlbums: (accessToken?: string) => Promise<void>;
  setAlbums: (albums: any[]) => void;
  reset: () => void;
}

export const useAlbumStore = create<AlbumStore>((set, get) => ({
  albums: [],
  isLoading: false,
  isLoaded: false,
  loadAlbums: async (accessToken) => {
    // Avoid redundant fetches if already loaded
    if (get().isLoaded) return;
    
    set({ isLoading: true });
    try {
      const data = await fetchAlbums(accessToken as string);
      set({ albums: data, isLoaded: true });
    } catch (error) {
      console.error('Failed to load albums', error);
    } finally {
      set({ isLoading: false });
    }
  },
  setAlbums: (albums) => set({ albums, isLoaded: true }),
  reset: () => set({ albums: [], isLoading: false, isLoaded: false }),
}));
