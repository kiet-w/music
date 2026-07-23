'use client';

// ponytail: monochromatic black and white tab switcher for youtube and google drive music imports
import React from 'react';
import { Youtube, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MusicTabSwitcherProps {
  activeTab: 'youtube' | 'drive';
  setActiveTab: (tab: 'youtube' | 'drive') => void;
}

export function MusicTabSwitcher({ activeTab, setActiveTab }: MusicTabSwitcherProps) {
  return (
    <div className="grid grid-cols-2 p-1 bg-zinc-900/90 border border-white/10 rounded-2xl gap-1 w-full">
      <button
        type="button"
        onClick={() => setActiveTab('youtube')}
        className={cn(
          'flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer',
          activeTab === 'youtube'
            ? 'bg-white text-zinc-950 shadow-md font-bold'
            : 'text-zinc-400 hover:text-white hover:bg-white/5'
        )}
      >
        <Youtube className="w-4 h-4" />
        <span>YouTube MP3</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('drive')}
        className={cn(
          'flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer',
          activeTab === 'drive'
            ? 'bg-white text-zinc-950 shadow-md font-bold'
            : 'text-zinc-400 hover:text-white hover:bg-white/5'
        )}
      >
        <HardDrive className="w-4 h-4" />
        <span>Google Drive MP3</span>
      </button>
    </div>
  );
}

export default MusicTabSwitcher;
