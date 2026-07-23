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
  queue: Track[];
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;

  play: (track: Track, localUrl?: string) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  reset: () => void;

  // ponytail: queue & card stack reordering methods
  setQueue: (tracks: Track[]) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  reorderQueue: (newQueue: Track[]) => void;
  moveQueueTrack: (fromIndex: number, toIndex: number) => void;
  playNext: () => void;
  playPrevious: () => void;
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
    queue: [],
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

      // Auto-append track to queue if not present
      let newQueue = state.queue;
      if (!newQueue.some((t) => t.id === track.id)) {
        newQueue = [...newQueue, track];
      }

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
          // Auto play next track in queue on end
          get().playNext();
        },
        onloaderror: (_id, error) => {
          console.error('Audio load error:', error);
          set({ isPlaying: false, currentTime: 0 });
          stopTimer();
        },
        onplayerror: (_id, error) => {
          console.error('Audio play error:', error);
          set({ isPlaying: false });
          stopTimer();
        },
      });

      _howl = newHowl;
      newHowl.play();
      set({ currentTrack: track, queue: newQueue, isPlaying: true, currentTime: 0 });
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

    setQueue: (tracks: Track[]) => {
      set({ queue: tracks });
    },

    addToQueue: (track: Track) => {
      const { queue } = get();
      if (!queue.some((t) => t.id === track.id)) {
        set({ queue: [...queue, track] });
      }
    },

    removeFromQueue: (trackId: string) => {
      const { queue, currentTrack } = get();
      const newQueue = queue.filter((t) => t.id !== trackId);
      set({ queue: newQueue });
      if (currentTrack?.id === trackId && newQueue.length > 0) {
        get().play(newQueue[0]);
      }
    },

    reorderQueue: (newQueue: Track[]) => {
      set({ queue: newQueue });
    },

    moveQueueTrack: (fromIndex: number, toIndex: number) => {
      const { queue } = get();
      if (fromIndex < 0 || fromIndex >= queue.length || toIndex < 0 || toIndex >= queue.length) return;
      const updatedQueue = [...queue];
      const [movedItem] = updatedQueue.splice(fromIndex, 1);
      updatedQueue.splice(toIndex, 0, movedItem);
      set({ queue: updatedQueue });
    },

    playNext: () => {
      const { currentTrack, queue } = get();
      if (!currentTrack || queue.length === 0) return;
      const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
      if (currentIndex !== -1 && currentIndex < queue.length - 1) {
        get().play(queue[currentIndex + 1]);
      } else if (queue.length > 0) {
        get().play(queue[0]);
      }
    },

    playPrevious: () => {
      const { currentTrack, queue } = get();
      if (!currentTrack || queue.length === 0) return;
      const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
      if (currentIndex > 0) {
        get().play(queue[currentIndex - 1]);
      } else {
        get().play(queue[queue.length - 1]);
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
        queue: [],
        isPlaying: false,
        duration: 0,
        currentTime: 0,
      });
    },
  };
});
