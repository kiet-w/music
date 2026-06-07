'use client';

import { create } from 'zustand';

import { fetchMe, type AuthUser } from '@/lib/api';
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
      const data = JSON.parse(stored) as { accessToken?: string; user?: AuthUser };
      const accessToken = data?.accessToken;

      if (!accessToken) {
        get().clearSession();
        set({ isHydrated: true });
        return;
      }

      const user = await fetchMe(accessToken);
      set({ accessToken, user, isHydrated: true });
    } catch (error) {
      console.error('Failed to hydrate auth session:', error);
      get().clearSession();
      set({ isHydrated: true });
    }
  },
}));
