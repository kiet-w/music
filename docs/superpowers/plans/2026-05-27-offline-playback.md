# Offline Music Playback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement offline music playback by allowing users to download songs to local device storage using Capacitor Filesystem.

**Architecture:** Use `@capacitor/filesystem` to fetch and store audio files locally. A custom hook (`useOfflineStorage`) will manage downloads and local states. The global `usePlayerStore` will intercept playback requests and serve the local `capacitor://` URI if the file is downloaded, otherwise it streams from the remote URL. The UI will reflect the download status of each track.

**Tech Stack:** React, Zustand, `@capacitor/filesystem`, `@capacitor/core`, Lucide React.

---

### Task 1: Install Dependencies & Setup

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install Capacitor plugins**
Execute the following command in the `frontend` directory to install the necessary Capacitor plugins.

```bash
cd frontend && npm install @capacitor/filesystem @capacitor/core
```

- [ ] **Step 2: Commit changes**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore: install capacitor filesystem for offline storage"
```

### Task 2: Create Offline Storage Manager Hook

**Files:**
- Create: `frontend/src/hooks/useOfflineStorage.ts`

- [ ] **Step 1: Implement the hook**
Create a custom hook that manages downloading, removing, and checking local files using `@capacitor/filesystem`.

```typescript
// frontend/src/hooks/useOfflineStorage.ts
import { useState, useEffect, useCallback } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export function useOfflineStorage() {
  const [offlineTracks, setOfflineTracks] = useState<Set<string>>(new Set());

  // Load initial state
  useEffect(() => {
    const checkExistingFiles = async () => {
      try {
        const result = await Filesystem.readdir({
          path: 'offline_music',
          directory: Directory.Data,
        }).catch(() => null); // Ignore if dir doesn't exist yet

        if (result) {
          const ids = result.files.map(f => f.name.replace('.mp3', ''));
          setOfflineTracks(new Set(ids));
        }
      } catch (error) {
        console.error('Failed to read offline directory', error);
      }
    };
    checkExistingFiles();
  }, []);

  const downloadTrack = useCallback(async (trackId: string, url: string) => {
    try {
      // Ensure directory exists
      await Filesystem.mkdir({
        path: 'offline_music',
        directory: Directory.Data,
        recursive: true
      }).catch(() => {});

      // Fetch the file as a Blob
      const response = await fetch(url);
      const blob = await response.blob();

      // Convert Blob to Base64
      const reader = new FileReader();
      const base64data = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Write to filesystem
      await Filesystem.writeFile({
        path: `offline_music/${trackId}.mp3`,
        data: base64data,
        directory: Directory.Data,
      });

      setOfflineTracks(prev => {
        const next = new Set(prev);
        next.add(trackId);
        return next;
      });
      return true;
    } catch (error) {
      console.error('Failed to download track', error);
      return false;
    }
  }, []);

  const removeTrack = useCallback(async (trackId: string) => {
    try {
      await Filesystem.deleteFile({
        path: `offline_music/${trackId}.mp3`,
        directory: Directory.Data,
      });
      setOfflineTracks(prev => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });
      return true;
    } catch (error) {
      console.error('Failed to remove track', error);
      return false;
    }
  }, []);

  const getLocalUri = useCallback(async (trackId: string): Promise<string | null> => {
    try {
      if (!offlineTracks.has(trackId)) return null;
      
      const result = await Filesystem.getUri({
        path: `offline_music/${trackId}.mp3`,
        directory: Directory.Data,
      });
      
      return Capacitor.convertFileSrc(result.uri);
    } catch (error) {
      return null;
    }
  }, [offlineTracks]);

  return {
    offlineTracks,
    downloadTrack,
    removeTrack,
    getLocalUri,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/hooks/useOfflineStorage.ts
git commit -m "feat: add useOfflineStorage hook for capacitor filesystem"
```

### Task 3: Integrate Offline Storage with Player Store

**Files:**
- Modify: `frontend/src/store/usePlayerStore.ts`

- [ ] **Step 1: Update the store to handle local URIs**
We need to modify the `play` action to accept an optional `localUri`. The interception will happen at the component level to keep the store pure, but the store needs to know how to play it.

```typescript
// frontend/src/store/usePlayerStore.ts
// Add optional localUrl to the play signature
  play: (track: Track, tracks?: Track[], localUrl?: string) => void;

// Update the play implementation
  play: (track, tracks, localUrl) => {
    const { sound } = get();
    if (sound) {
      sound.unload();
    }

    const playUrl = localUrl || track.url;
    console.log(`Playing audio from: ${playUrl}`);

    const newSound = new Howl({
      src: [playUrl],
      html5: true,
      format: ['mp3'],
      onplay: () => {
        set({ isPlaying: true });
        requestAnimationFrame(updateTime);
      },
      onend: () => {
        set({ isPlaying: false, currentTime: 0 });
        get().next();
      },
      onpause: () => {
        set({ isPlaying: false });
      },
      onload: () => {
        set({ duration: newSound.duration() });
      }
    });

    set({ 
      currentTrack: track, 
      queue: tracks || get().queue,
      sound: newSound,
    });

    newSound.play();
  },
```

- [ ] **Step 2: Verify typescript compilation**
- [ ] **Step 3: Commit**

```bash
git add frontend/src/store/usePlayerStore.ts
git commit -m "feat: support localUrl playback in usePlayerStore"
```

### Task 4: Update Library UI for Downloading

**Files:**
- Modify: `frontend/src/components/molecules/Library/Library.tsx`

- [ ] **Step 1: Import and use the hook**
- [ ] **Step 2: Add download UI state and buttons**

```tsx
// frontend/src/components/molecules/Library/Library.tsx
// Add imports
import { Download, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { useState } from 'react';

// Inside Library component
  const { offlineTracks, downloadTrack, removeTrack, getLocalUri } = useOfflineStorage();
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const handleDownload = async (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    if (downloadingIds.has(track.id)) return;

    setDownloadingIds(prev => new Set(prev).add(track.id));
    await downloadTrack(track.id, track.url);
    setDownloadingIds(prev => {
      const next = new Set(prev);
      next.delete(track.id);
      return next;
    });
  };

  const handleRemoveOffline = async (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    await removeTrack(trackId);
  };

  const handleTrackSelect = async (track: Track) => {
    const localUri = await getLocalUri(track.id);
    onTrackSelect(track, tracks, localUri || undefined);
  };

// Update the list mapping (replace the mapping logic)
        {tracks.map((track, index) => {
          const isDownloaded = offlineTracks.has(track.id);
          const isDownloading = downloadingIds.has(track.id);

          return (
            <div 
              key={track.id} 
              onClick={() => handleTrackSelect(track)}
              className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-300 group ${
                currentTrackId === track.id 
                  ? 'bg-accent/20 border-[0.5px] border-accent/30' 
                  : 'hover:bg-muted/50 border-[0.5px] border-transparent'
              }`}
            >
              <div className="w-8 text-center text-muted-foreground text-sm font-medium">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0 ml-3 pr-4">
                <h3 className={`text-[15px] font-medium truncate ${currentTrackId === track.id ? 'text-accent' : ''}`}>
                  {track.title}
                </h3>
                <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
              </div>
              
              {/* Offline Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 text-accent animate-spin" />
                ) : isDownloaded ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <button 
                      onClick={(e) => handleRemoveOffline(e, track.id)}
                      className="p-1.5 rounded-md hover:bg-red-500/20 text-red-500 transition-colors"
                      title="Remove from device"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={(e) => handleDownload(e, track)}
                    className="p-1.5 rounded-md hover:bg-accent/20 text-accent transition-colors"
                    title="Download for offline"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/molecules/Library/Library.tsx
git commit -m "feat: add download buttons and offline playback logic to Library"
```
