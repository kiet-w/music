'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/atoms/ui/button';
import { Play, Pause, Volume2, Loader2 } from 'lucide-react';

interface PlayerProps {
  url: string;
}

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const Player: React.FC<PlayerProps> = ({ url }) => {
  const t = useTranslations('Music');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // ponytail: progress tracked via DOM refs, not React state — avoids 60-120 re-renders/sec
  const [sliderValue, setSliderValue] = useState(0);

  const howlRef = useRef<Howl | null>(null);
  const rafRef = useRef<number | null>(null);
  const currentTimeRef = useRef<HTMLSpanElement>(null);
  const progressBarRef = useRef<HTMLInputElement>(null);

  const stopUpdate = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startUpdate = useCallback(() => {
    const update = () => {
      if (howlRef.current && howlRef.current.playing() && !isDragging) {
        const seek = howlRef.current.seek();
        const dur = howlRef.current.duration();
        if (dur > 0) {
          const pct = (seek / dur) * 100;
          // ponytail: direct DOM mutation, no setState
          if (currentTimeRef.current) {
            currentTimeRef.current.textContent = formatTime(seek);
          }
          if (progressBarRef.current) {
            progressBarRef.current.value = String(pct);
          }
        }
      }
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
  }, [isDragging]);

  useEffect(() => {
    if (!url) return;

    setLoading(true);
    if (howlRef.current) {
      howlRef.current.unload();
    }

    howlRef.current = new Howl({
      src: [url],
      html5: true,
      format: ['mp3'],
      volume: volume,
      onload: () => {
        setDuration(howlRef.current?.duration() || 0);
        setLoading(false);
      },
      onloaderror: (id, err) => {
        console.error('Howler load error:', err);
        setLoading(false);
      },
      onplayerror: (id, err) => {
        console.error('Howler play error:', err);
        setLoading(false);
        setIsPlaying(false);
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
      },
      onend: () => {
        setIsPlaying(false);
        stopUpdate();
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

  const togglePlay = () => {
    if (!howlRef.current) return;
    if (isPlaying) {
      howlRef.current.pause();
    } else {
      howlRef.current.play();
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderValue(parseFloat(e.target.value));
  };

  const handleSeekEnd = (e: React.ChangeEvent<HTMLInputElement> | React.MouseEvent | React.TouchEvent) => {
    if (!howlRef.current) return;
    const input = (e.target as HTMLInputElement);
    const value = parseFloat(input.value);
    const seekTime = (value / 100) * duration;
    howlRef.current.seek(seekTime);
    setSliderValue(value);
    setIsDragging(false);
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
          <span ref={currentTimeRef}>0:00</span>
          <span>{formatTime(duration)}</span>
        </div>
        <input
          ref={progressBarRef}
          type="range"
          min="0"
          max="100"
          step="0.1"
          defaultValue={0}
          onChange={handleSeekChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={handleSeekEnd}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={handleSeekEnd}
          className="player-slider"
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
