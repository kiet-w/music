'use client';

import { useTranslations } from 'next-intl';
import { Downloader } from '@/components/molecules/Downloader/Downloader';
import { Youtube, FileAudio, ArrowDownToLine } from 'lucide-react';
import { MainContainer } from '@/components/layout/MainContainer';

export default function MusicTemplate() {
  const t = useTranslations('Music');
  
  return (
    <MainContainer>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif italic tracking-tight">{t('add_music')}</h1>
      </div>

      {/* Section A: YouTube Converter */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <Youtube className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-medium">{t('from_youtube')}</h2>
        </div>
        
        <div className="bg-muted/30 border-[0.5px] border-border p-4 rounded-2xl">
          <Downloader />
        </div>
        
        {/* Placeholder for recent history */}
        <div className="pt-2">
          <h3 className="text-[13px] text-muted-foreground font-medium mb-3">{t('recent')}</h3>
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-card border-[0.5px] border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileAudio className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium truncate">{t('downloading')}</p>
                    <p className="text-[11px] text-muted-foreground">0%</p>
                  </div>
                </div>
                <ArrowDownToLine className="w-4 h-4 text-muted-foreground shrink-0 animate-bounce" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </MainContainer>
  );
}
