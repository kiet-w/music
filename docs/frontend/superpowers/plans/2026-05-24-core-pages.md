# Core Pages & Skeletons (Part 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete component refactoring and implement core pages (Home, Album Detail) with loading states.

**Architecture:** Refactor molecule components to use Tailwind CSS and Shadcn UI components. Implement Next.js App Router pages with i18n support and loading skeletons.

**Tech Stack:** React, Next.js 14, Tailwind CSS, Shadcn UI, howler.js, next-intl, zustand.

---

### Task 1: Refactor Downloader Component

**Files:**
- Modify: `src/components/molecules/Downloader/Downloader.tsx`
- Delete: `src/components/molecules/Downloader/Downloader.css`

- [ ] **Step 1: Update Downloader.tsx with Tailwind and Shadcn**

```tsx
'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/atoms/ui/button';
import { Download, Loader2 } from 'lucide-react';

interface DownloaderProps {
  onDownloadStarted?: (url: string) => void;
}

export const Downloader: React.FC<DownloaderProps> = ({ onDownloadStarted }) => {
  const t = useTranslations('Music');
  const [url, setUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsDownloading(true);
    setStatus(t('preparing'));

    // Mock download process
    setTimeout(() => {
      setStatus(t('converting'));
      setTimeout(() => {
        setStatus(t('success'));
        setIsDownloading(false);
        setUrl('');
        if (onDownloadStarted) onDownloadStarted(url);
        
        // Clear status after 3 seconds
        setTimeout(() => setStatus(null), 3000);
      }, 2000);
    }, 1500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input 
          type="text" 
          placeholder={t('paste_url')}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isDownloading}
          className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Button 
          type="submit" 
          disabled={isDownloading || !url}
          className="shrink-0"
        >
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('downloading')}
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              {t('download')}
            </>
          )}
        </Button>
      </form>
      {status && (
        <p className="text-sm text-center text-muted-foreground animate-in fade-in slide-in-from-top-1">
          {status}
        </p>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Delete Downloader.css**

Run: `rm src/components/molecules/Downloader/Downloader.css`

---

### Task 2: Refactor Player Component

**Files:**
- Modify: `src/components/molecules/Player/Player.tsx`
- Delete: `src/components/molecules/Player/Player.css`

- [ ] **Step 1: Update Player.tsx with Tailwind and icons**

```tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/atoms/ui/button';
import { Play, Pause, Volume2, Loader2 } from 'lucide-react';

interface PlayerProps {
  url: string;
}

export const Player: React.FC<PlayerProps> = ({ url }) => {
  const t = useTranslations('Music');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [loading, setLoading] = useState(false);
  
  const howlRef = useRef<Howl | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!url) return;

    setLoading(true);
    if (howlRef.current) {
      howlRef.current.unload();
    }

    howlRef.current = new Howl({
      src: [url],
      html5: true,
      volume: volume,
      onload: () => {
        setDuration(howlRef.current?.duration() || 0);
        setLoading(false);
      },
      onplay: () => {
        setIsPlaying(true);
        startUpdate();
      },
      onpause: () => {
        setIsPlaying(false);
        stopUpdate();
      },
      onstop: () => {
        setIsPlaying(false);
        stopUpdate();
        setProgress(0);
      },
      onend: () => {
        setIsPlaying(false);
        stopUpdate();
        setProgress(100);
      },
    });

    return () => {
      if (howlRef.current) {
        howlRef.current.unload();
      }
      stopUpdate();
    };
  }, [url]);

  useEffect(() => {
    if (howlRef.current) {
      howlRef.current.volume(volume);
    }
  }, [volume]);

  const startUpdate = () => {
    const update = () => {
      if (howlRef.current && howlRef.current.playing()) {
        const seek = howlRef.current.seek();
        const duration = howlRef.current.duration();
        if (duration > 0) {
          setProgress((seek / duration) * 100);
        }
        rafRef.current = requestAnimationFrame(update);
      }
    };
    rafRef.current = requestAnimationFrame(update);
  };

  const stopUpdate = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  };

  const togglePlay = () => {
    if (!howlRef.current) return;
    if (isPlaying) {
      howlRef.current.pause();
    } else {
      howlRef.current.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!howlRef.current) return;
    const value = parseFloat(e.target.value);
    const seekTime = (value / 100) * duration;
    howlRef.current.seek(seekTime);
    setProgress(value);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-center">
        <Button 
          onClick={togglePlay} 
          disabled={loading || !url} 
          size="icon"
          variant="secondary"
          className="w-16 h-16 rounded-full"
        >
          {loading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-8 h-8 fill-current" />
          ) : (
            <Play className="w-8 h-8 fill-current ml-1" />
          )}
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground font-mono">
          <span>{formatTime((progress / 100) * duration)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="100" 
          step="0.1"
          value={progress} 
          onChange={handleSeek}
          className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
          disabled={!url || duration === 0}
        />
      </div>

      <div className="flex items-center gap-4 max-w-[200px] mx-auto">
        <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01"
          value={volume} 
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-muted-foreground"
        />
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Delete Player.css**

Run: `rm src/components/molecules/Player/Player.css`

---

### Task 3: Cleanup Library CSS

**Files:**
- Delete: `src/components/molecules/Library/Library.css`

- [ ] **Step 1: Delete Library.css**

Run: `rm src/components/molecules/Library/Library.css`

---

### Task 4: Implement Home Page with Featured Albums

**Files:**
- Modify: `app/[locale]/page.tsx`

- [ ] **Step 1: Update Home Page**

```tsx
'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Library } from '@/components/molecules/Library/Library';
import { Downloader } from '@/components/molecules/Downloader/Downloader';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Card, CardContent } from '@/components/atoms/ui/card';

const MOCK_ALBUMS = [
  {
    id: '1',
    title: 'Relaxing Lo-Fi',
    artist: 'Study Beats',
    coverUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=300&h=300&auto=format&fit=crop'
  },
  {
    id: '2',
    title: 'Midnight Jazz',
    artist: 'Smooth Trio',
    coverUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300&h=300&auto=format&fit=crop'
  },
  {
    id: '3',
    title: 'Morning Acoustic',
    artist: 'Sunny Days',
    coverUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=300&h=300&auto=format&fit=crop'
  }
];

export default function HomePage() {
  const t = useTranslations('Music');
  const { currentTrack, play } = usePlayerStore();

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-12 pb-32">
      <section>
        <h1 className="text-3xl font-bold tracking-tight mb-8">{t('title')}</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {MOCK_ALBUMS.map((album) => (
            <Link href={`/album/${album.id}`} key={album.id}>
              <Card className="overflow-hidden border-none bg-transparent shadow-none hover:opacity-80 transition-opacity">
                <CardContent className="p-0">
                  <div className="aspect-square w-full rounded-xl overflow-hidden bg-muted mb-3">
                    <img 
                      src={album.coverUrl} 
                      alt={album.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold leading-none">{album.title}</h3>
                    <p className="text-sm text-muted-foreground">{album.artist}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-12">
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">{t('library')}</h2>
          <Library 
            onTrackSelect={play}
            currentTrackUrl={currentTrack?.url}
          />
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">{t('download')}</h2>
          <Downloader onDownloadStarted={(url) => console.log('Download started:', url)} />
        </section>
      </div>
    </main>
  );
}
```

---

### Task 5: Create Loading States

**Files:**
- Create: `app/[locale]/loading.tsx`
- Create: `app/[locale]/album/[id]/loading.tsx`

- [ ] **Step 1: Create Home Loading State**

```tsx
import { AlbumSkeleton } from "@/components/atoms/AlbumSkeleton"
import { TrackSkeleton } from "@/components/atoms/TrackSkeleton"

export default function Loading() {
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-12">
      <div className="h-10 w-48 bg-muted animate-pulse rounded-md mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <AlbumSkeleton key={i} />
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-12 pt-4">
        <div className="space-y-4">
          <div className="h-8 w-32 bg-muted animate-pulse rounded-md mb-2" />
          {[...Array(4)].map((_, i) => (
            <TrackSkeleton key={i} />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-8 w-32 bg-muted animate-pulse rounded-md mb-2" />
          <div className="h-32 w-full bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Create Album Loading State**

```tsx
import { TrackSkeleton } from "@/components/atoms/TrackSkeleton"

export default function Loading() {
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-12">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-64 h-64 bg-muted animate-pulse rounded-2xl shrink-0" />
        <div className="space-y-4 pt-4 flex-1">
          <div className="h-10 w-3/4 bg-muted animate-pulse rounded-md" />
          <div className="h-6 w-1/4 bg-muted animate-pulse rounded-md" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded-full mt-4" />
        </div>
      </div>
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <TrackSkeleton key={i} />
        ))}
      </div>
    </main>
  )
}
```

---

### Task 6: Create Album Detail Page

**Files:**
- Create: `app/[locale]/album/[id]/page.tsx`

- [ ] **Step 1: Create Album Detail Page**

```tsx
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Library } from '@/components/molecules/Library/Library';
import { Play } from 'lucide-react';
import { Button } from '@/components/atoms/ui/button';

interface AlbumPageProps {
  params: {
    id: string;
    locale: string;
  };
}

const MOCK_ALBUMS_DATA: Record<string, any> = {
  '1': {
    title: 'Relaxing Lo-Fi',
    artist: 'Study Beats',
    coverUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=600&h=600&auto=format&fit=crop',
    tracks: [
      { id: '1-1', title: 'Focus Flow', artist: 'Study Beats', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', duration: '3:45' },
      { id: '1-2', title: 'Coffee Shop', artist: 'Study Beats', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', duration: '4:12' },
      { id: '1-3', title: 'Rainy Window', artist: 'Study Beats', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', duration: '2:58' },
    ]
  },
  '2': {
    title: 'Midnight Jazz',
    artist: 'Smooth Trio',
    coverUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&h=600&auto=format&fit=crop',
    tracks: [
      { id: '2-1', title: 'Blue Notes', artist: 'Smooth Trio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', duration: '5:20' },
      { id: '2-2', title: 'Late Night Walk', artist: 'Smooth Trio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', duration: '4:45' },
    ]
  },
  '3': {
    title: 'Morning Acoustic',
    artist: 'Sunny Days',
    coverUrl: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=600&h=600&auto=format&fit=crop',
    tracks: [
      { id: '3-1', title: 'Sunrise', artist: 'Sunny Days', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', duration: '3:15' },
    ]
  }
};

export function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const t = await getTranslations('Music');
  const album = MOCK_ALBUMS_DATA[params.id];

  if (!album) {
    return <div>Album not found</div>;
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-12 pb-32">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-64 h-64 bg-muted rounded-2xl overflow-hidden shrink-0 shadow-lg">
          <img 
            src={album.coverUrl} 
            alt={album.title} 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="space-y-4 pt-4">
          <h1 className="text-4xl font-bold tracking-tight">{album.title}</h1>
          <p className="text-xl text-muted-foreground">{album.artist}</p>
          <Button className="rounded-full px-8" size="lg">
            <Play className="mr-2 h-5 w-5 fill-current" />
            Play All
          </Button>
        </div>
      </div>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">{t('tracks')}</h2>
        {/* We reuse the Library component here, but in a real app it might filter tracks or take them as props */}
        {/* For now, we'll just show the tracks in a simple list if we want to be surgical, 
            but the design says "Album info and list of tracks" */}
        <div className="flex flex-col gap-2">
          {album.tracks.map((track: any) => (
            <div 
              key={track.id} 
              className="flex justify-between items-center p-4 rounded-lg border border-border bg-card cursor-pointer transition-all hover:border-accent/50 hover:bg-accent/5"
            >
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground leading-tight">{track.title}</span>
                <span className="text-sm text-muted-foreground">{track.artist}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground font-mono">{track.duration}</span>
                <Button size="sm" variant="secondary" className="h-8 px-3 text-xs font-semibold">
                  {t('play')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
```

---

### Task 7: Final Verification

- [ ] **Step 1: Run build to verify no errors**

Run: `npm run build`

- [ ] **Step 2: Check for any leftover CSS imports**

Run: `grep -r "\.css" src/components/molecules`
Expected: Only `PlayerBar.tsx` or other intentional ones (Library, Player, Downloader should have NONE).
Wait, I deleted them, so they should be gone.

- [ ] **Step 3: Verify Home page and Album page navigation**

(Manual check in browser if possible, otherwise rely on build success)
