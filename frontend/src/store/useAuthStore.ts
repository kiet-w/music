'use client';

import { create } from 'zustand';
import { AuthUser, fetchMe } from '@/lib/api';
import { useAlbumStore } from '@/store/useAlbumStore';
import { usePlayerStore } from '@/store/usePlayerStore';

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (accessToken: string, user: AuthUser) => void;
  clearSession: () => void;
};

const AUTH_STORAGE_KEY = 'music.auth';

const resetUserScopedState = () => {
  usePlayerStore.getState().reset();
  useAlbumStore.getState().reset();
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isHydrated: false,

  setSession: (accessToken, user) => {
    const previousUserId = get().user?.id;
    if (previousUserId !== user.id) {
      resetUserScopedState();
    }

    set({ accessToken, user });
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ accessToken, user }));
    }
  },

  clearSession: () => {
    set({ accessToken: null, user: null });
    resetUserScopedState();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  },

  hydrate: async () => {
    // If we're on the server, we can't hydrate from localStorage
    if (typeof window === 'undefined') {
      set({ isHydrated: true });
      return;
    }

    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    
    if (!stored) {
      set({ isHydrated: true });
      return;
    }

    try {
      const data = JSON.parse(stored);
      const accessToken = data?.accessToken;
      
      if (!accessToken) {
        get().clearSession();
        set({ isHydrated: true });
        return;
      }

      // Verify token with backend to get fresh user data
      try {
        const user = await fetchMe(accessToken);
        set({ accessToken, user, isHydrated: true });
      } catch (error) {
        console.error('Failed to verify session during hydration:', error);
        get().clearSession();
        set({ isHydrated: true });
      }
    } catch (error) {
      console.error('Failed to parse auth storage during hydration:', error);
      get().clearSession();
      set({ isHydrated: true });
    }
  },
}));
