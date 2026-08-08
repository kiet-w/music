import { create } from 'zustand';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

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

  setQueue: (tracks: Track[]) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  reorderQueue: (newQueue: Track[]) => void;
  moveQueueTrack: (fromIndex: number, toIndex: number) => void;
  playNext: () => void;
  playPrevious: () => void;
}

let _sound: Audio.Sound | null = null;

export const getSound = () => _sound;

// Setup Audio mode for background playback if possible
Audio.setAudioModeAsync({
  allowsRecordingIOS: false,
  staysActiveInBackground: true,
  interruptionModeIOS: InterruptionModeIOS.DoNotMix,
  playsInSilentModeIOS: true,
  shouldDuckAndroid: true,
  interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
  playThroughEarpieceAndroid: false,
}).catch(console.warn);

export const usePlayerStore = create<PlayerState>((set, get) => {
  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      set({
        duration: (status.durationMillis || 0) / 1000,
        currentTime: (status.positionMillis || 0) / 1000,
        isPlaying: status.isPlaying,
      });

      if (status.didJustFinish && !status.isLooping) {
        set({ isPlaying: false, currentTime: 0 });
        get().playNext();
      }
    } else if (status.error) {
      console.error('Audio play error:', status.error);
      set({ isPlaying: false });
    }
  };

  return {
    currentTrack: null,
    queue: [],
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    volume: 1,

    play: async (track: Track, localUrl?: string) => {
      const state = get();
      
      try {
        if (_sound) {
          await _sound.unloadAsync();
          _sound = null;
        }

        const playUrl = localUrl || track.url;
        console.log(`Playing audio from: ${playUrl}`);

        let newQueue = state.queue;
        if (!newQueue.some((t) => t.id === track.id)) {
          newQueue = [...newQueue, track];
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri: playUrl },
          { shouldPlay: true, volume: state.volume }
        );

        _sound = sound;
        _sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
        
        set({ currentTrack: track, queue: newQueue, isPlaying: true, currentTime: 0 });
      } catch (error) {
        console.error('Failed to play track:', error);
      }
    },

    pause: async () => {
      if (_sound) {
        await _sound.pauseAsync();
      }
    },

    resume: async () => {
      if (_sound) {
        await _sound.playAsync();
      }
    },

    togglePlay: async () => {
      const { isPlaying, currentTrack } = get();
      if (!currentTrack) return;

      if (isPlaying) {
        await _sound?.pauseAsync();
      } else {
        await _sound?.playAsync();
      }
    },

    seek: async (time: number) => {
      if (_sound) {
        await _sound.setPositionAsync(time * 1000);
        set({ currentTime: time });
      }
    },

    setVolume: async (volume: number) => {
      set({ volume });
      if (_sound) {
        await _sound.setVolumeAsync(volume);
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

    reset: async () => {
      if (_sound) {
        await _sound.unloadAsync();
        _sound = null;
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
