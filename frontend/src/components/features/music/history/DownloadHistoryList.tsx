'use client';

import React from 'react';
import { FileAudio, CheckCircle2 } from 'lucide-react';

interface HistoryItem {
  id: string;
  title: string;
  artist?: string;
  albumTitle: string;
}

interface DownloadHistoryListProps {
  history: HistoryItem[];
  t: (key: string) => string;
}

export function DownloadHistoryList({ history, t }: DownloadHistoryListProps) {
  if (history.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6 px-4">
        <h3 className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] uppercase">{t('recent')}</h3>
        <div className="h-[0.5px] flex-1 bg-border/50 ml-4" />
      </div>
      <div className="flex flex-col gap-3">
        {history.slice(0, 5).map((item) => (
          <div 
            key={item.id} 
            className="flex items-center justify-between p-4 rounded-[1.5rem] bg-muted/20 border border-border/50"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shrink-0 border border-border/50">
                <FileAudio className="w-5 h-5 text-muted-foreground/60" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-[10px] text-muted-foreground font-sans truncate uppercase tracking-wider">
                  {item.artist || 'Unknown'} • {item.albumTitle}
                </p>
              </div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          </div>
        ))}
      </div>
    </section>
  );
}
