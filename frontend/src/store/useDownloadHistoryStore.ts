
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { persist, createJSONStorage } from 'zustand/middleware';

export interface DownloadHistoryItem {
  id: string;
  title: string;
  artist?: string;
  albumTitle: string;
  downloadedAt: number;
}

interface DownloadHistoryState {
  historyByUserId: Record<string, DownloadHistoryItem[]>;
  addHistory: (userId: string, track: any, albumTitle: string) => void;
  clearHistory: (userId: string) => void;
}

export const useDownloadHistoryStore = create<DownloadHistoryState>()(
  persist(
    (set) => ({
      historyByUserId: {},
      addHistory: (userId, track, albumTitle) => {
        const newItem: DownloadHistoryItem = {
          id: track.id,
          title: track.title,
          artist: track.artist,
          albumTitle: albumTitle || 'Single',
          downloadedAt: Date.now(),
        };

        set((state) => {
          const userHistory = state.historyByUserId[userId] || [];
          // Remove if already exists (to move it to top)
          const filtered = userHistory.filter((item) => item.id !== track.id);
          // Keep only the most recent 2, then add the new one to make it 3
          const newHistory = [newItem, ...filtered].slice(0, 3);
          
          return { 
            historyByUserId: {
              ...state.historyByUserId,
              [userId]: newHistory
            }
          };
        });
      },
      clearHistory: (userId) => set((state) => ({ 
        historyByUserId: {
          ...state.historyByUserId,
          [userId]: []
        }
      })),
    }),
    {
      name: 'download-history-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
