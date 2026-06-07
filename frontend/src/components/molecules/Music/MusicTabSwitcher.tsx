'use client';

import React from 'react';
import { Youtube, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MusicTabSwitcherProps {
  activeTab: 'youtube' | 'drive';
  setActiveTab: (tab: 'youtube' | 'drive') => void;
}

export function MusicTabSwitcher({ activeTab, setActiveTab }: MusicTabSwitcherProps) {
  return (
    <div className="flex p-1 bg-muted/50 rounded-2xl border border-border/50 mb-8 max-w-[320px]">
      <button 
        onClick={() => setActiveTab('youtube')}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
          activeTab === 'youtube' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Youtube size={16} />
        YouTube
      </button>
      <button 
        onClick={() => setActiveTab('drive')}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
          activeTab === 'drive' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <HardDrive size={16} />
        Google Drive
      </button>
    </div>
  );
}
