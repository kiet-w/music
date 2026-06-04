'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface DownloadHistoryItem {
  id: string;
  title: string;
  artist?: string;
  albumTitle: string;
  downloadedAt: number;
}

interface DownloadHistoryState {
  history: DownloadHistoryItem[];
  addHistory: (track: any, albumTitle: string) => void;
  clearHistory: () => void;
}

export const useDownloadHistoryStore = create<DownloadHistoryState>()(
  persist(
    (set) => ({
      history: [],
      addHistory: (track, albumTitle) => {
        const newItem: DownloadHistoryItem = {
          id: track.id,
          title: track.title,
          artist: track.artist,
          albumTitle: albumTitle || 'Single',
          downloadedAt: Date.now(),
        };

        set((state) => {
          // Remove if already exists (to move it to top)
          const filtered = state.history.filter((item) => item.id !== track.id);
          // Keep only the most recent 2, then add the new one to make it 3
          const newHistory = [newItem, ...filtered].slice(0, 3);
          return { history: newHistory };
        });
      },
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'download-history-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
