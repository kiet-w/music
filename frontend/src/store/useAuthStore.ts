'use client';

import { create } from 'zustand';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

import { fetchMe, type AuthUser } from '@/lib/api';
import { useAlbumStore } from '@/store/useAlbumStore';
import { usePlayerStore } from '@/store/usePlayerStore';

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (accessToken: string, user: AuthUser) => Promise<void>;
  clearSession: () => Promise<void>;
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

  setSession: async (accessToken, user) => {
    const previousUserId = get().user?.id;
    if (user?.id && previousUserId !== user.id) {
      resetUserScopedState();
    }

    set({ accessToken, user: user || null });

    if (typeof window !== 'undefined') {
      if (Capacitor.isNativePlatform()) {
        await Preferences.set({
          key: AUTH_STORAGE_KEY,
          value: JSON.stringify({ accessToken, user }),
        });
      } else {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ accessToken, user }));
      }
    }
  },

  clearSession: async () => {
    set({ accessToken: null, user: null });
    resetUserScopedState();

    if (typeof window !== 'undefined') {
      if (Capacitor.isNativePlatform()) {
        await Preferences.remove({ key: AUTH_STORAGE_KEY });
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  },

  hydrate: async () => {
    if (typeof window === 'undefined') {
      set({ isHydrated: true });
      return;
    }

    let stored: string | null = null;
    try {
      if (Capacitor.isNativePlatform()) {
        const { value } = await Preferences.get({ key: AUTH_STORAGE_KEY });
        stored = value;
      } else {
        stored = localStorage.getItem(AUTH_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to get auth session from storage:', e);
    }

    if (!stored) {
      set({ isHydrated: true });
      return;
    }

    try {
      const data = JSON.parse(stored) as { accessToken?: string; user?: AuthUser };
      const accessToken = data?.accessToken;

      if (!accessToken) {
        await get().clearSession();
        set({ isHydrated: true });
        return;
      }

      const user = await fetchMe(accessToken);
      set({ accessToken, user, isHydrated: true });
    } catch (error) {
      console.error('Failed to hydrate auth session:', error);
      await get().clearSession();
      set({ isHydrated: true });
    }
  },
}));
