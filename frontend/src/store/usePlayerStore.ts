'use client';

import { create } from 'zustand';
import { Howl } from 'howler';

export interface Track {
  id: string;
  title: string;
  artist: string | null;
  url: string;
  coverUrl?: string;
  albumId?: string;
}

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  howl: Howl | null;
  duration: number;
  currentTime: number;
  play: (track: Track, localUrl?: string) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  let timer: ReturnType<typeof setInterval> | null = null;

  const startTimer = () => {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      const { howl, isPlaying } = get();
      if (howl && isPlaying) {
        set({ currentTime: howl.seek() as number });
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  return {
    currentTrack: null,
    isPlaying: false,
    howl: null,
    duration: 0,
    currentTime: 0,
    volume: 1,

    play: (track: Track, localUrl?: string) => {
      const state = get();
      if (state.howl) {
        state.howl.unload();
      }

      const playUrl = localUrl || track.url;
      console.log(`Playing audio from: ${playUrl}`);

      const newHowl = new Howl({
        src: [playUrl],
        html5: true,
        format: ['mp3'],
        volume: state.volume,
        onload: () => {
          set({ duration: newHowl.duration() });
        },
        onplay: () => {
          set({ isPlaying: true });
          startTimer();
        },
        onpause: () => {
          set({ isPlaying: false });
          stopTimer();
        },
        onstop: () => {
          set({ isPlaying: false, currentTime: 0 });
          stopTimer();
        },
        onend: () => {
          set({ isPlaying: false, currentTime: 0 });
          stopTimer();
        },
      });

      newHowl.play();
      set({ currentTrack: track, howl: newHowl, isPlaying: true, currentTime: 0 });
    },

    pause: () => {
      const { howl } = get();
      if (howl) {
        howl.pause();
      }
    },

    resume: () => {
      const { howl } = get();
      if (howl) {
        howl.play();
      }
    },

    togglePlay: () => {
      const { isPlaying, howl, currentTrack } = get();
      if (!currentTrack) return;

      if (isPlaying) {
        howl?.pause();
      } else {
        howl?.play();
      }
    },

    seek: (time: number) => {
      const { howl } = get();
      if (howl) {
        howl.seek(time);
        set({ currentTime: time });
      }
    },

    setVolume: (volume: number) => {
      set({ volume });
      const { howl } = get();
      if (howl) {
        howl.volume(volume);
      }
    },

    reset: () => {
      const { howl } = get();
      stopTimer();
      if (howl) {
        howl.unload();
      }
      set({
        currentTrack: null,
        isPlaying: false,
        howl: null,
        duration: 0,
        currentTime: 0,
      });
    },
  };
});
