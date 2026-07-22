'use client';

import { create } from 'zustand';
import { Howl } from 'howler';
import { toast } from 'sonner';

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

// ponytail: howl instance stored outside Zustand — non-serializable objects don't belong in state
let _howl: Howl | null = null;

export const getHowl = () => _howl;

export const usePlayerStore = create<PlayerState>((set, get) => {
  let timer: ReturnType<typeof setInterval> | null = null;

  const startTimer = () => {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      const { isPlaying } = get();
      if (_howl && isPlaying) {
        set({ currentTime: _howl.seek() as number });
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
    duration: 0,
    currentTime: 0,
    volume: 1,

    play: (track: Track, localUrl?: string) => {
      const state = get();
      if (_howl) {
        _howl.unload();
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
        onloaderror: (_id, error) => {
          console.error('Audio load error:', error);
          set({ isPlaying: false, currentTime: 0 });
          stopTimer();
          toast.error('Không thể tải file âm thanh này');
        },
        onplayerror: (_id, error) => {
          console.error('Audio play error:', error);
          set({ isPlaying: false });
          stopTimer();
          toast.error('Lỗi khi phát bài hát');
        },
      });

      _howl = newHowl;
      newHowl.play();
      set({ currentTrack: track, isPlaying: true, currentTime: 0 });
    },

    pause: () => {
      if (_howl) {
        _howl.pause();
      }
    },

    resume: () => {
      if (_howl) {
        _howl.play();
      }
    },

    togglePlay: () => {
      const { isPlaying, currentTrack } = get();
      if (!currentTrack) return;

      if (isPlaying) {
        _howl?.pause();
      } else {
        _howl?.play();
      }
    },

    seek: (time: number) => {
      if (_howl) {
        _howl.seek(time);
        set({ currentTime: time });
      }
    },

    setVolume: (volume: number) => {
      set({ volume });
      if (_howl) {
        _howl.volume(volume);
      }
    },

    reset: () => {
      stopTimer();
      if (_howl) {
        _howl.unload();
        _howl = null;
      }
      set({
        currentTrack: null,
        isPlaying: false,
        duration: 0,
        currentTime: 0,
      });
    },
  };
});
