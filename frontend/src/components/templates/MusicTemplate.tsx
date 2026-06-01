'use client';

import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { Youtube, FileAudio, ArrowDownToLine } from 'lucide-react';
import { MainContainer } from '@/components/layout/MainContainer';

const Downloader = dynamic(() => import('@/components/molecules/Downloader/Downloader'), {
  ssr: false,
  loading: () => <div className="h-[200px] bg-muted animate-pulse rounded-[2rem]" />
});

export default function MusicTemplate() {
  const t = useTranslations('Music');
  
  return (
    <MainContainer>
      <div className="flex flex-col gap-2 mb-12 mt-4">
        <h1 className="font-instrument text-4xl md:text-5xl tracking-tighter leading-none">{t('add_music')}</h1>
        <p className="text-base text-muted-foreground leading-relaxed font-sans">
          Convert and download your favorite tracks.
        </p>
      </div>

      {/* Section A: YouTube Converter */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-sm border border-red-500/10">
            <Youtube className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-medium tracking-tight">{t('from_youtube')}</h2>
        </div>
        
        <div className="bg-card border-[0.5px] border-border p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
          <div className="relative z-10">
            <Downloader />
          </div>
        </div>
        
        {/* Placeholder for recent history with asymmetric spacing */}
        <div className="pt-4 ml-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm text-muted-foreground font-medium tracking-widest uppercase">{t('recent')}</h3>
            <div className="h-[1px] flex-1 bg-border/50 ml-4" />
          </div>
          <div className="flex flex-col gap-4 -ml-4">
            {[1, 2].map((i) => (
              <div 
                key={i} 
                className={`flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all ${i % 2 === 0 ? "ml-8" : "mr-4"}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center shrink-0 shadow-sm border border-border/50">
                    <FileAudio className="w-5 h-5 text-muted-foreground/60" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-medium truncate">{t('downloading')}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="w-full h-full bg-primary/40 rounded-full" 
                          style={{ width: i === 1 ? "33%" : "0%" }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground font-sans">{i === 1 ? "33%" : "0%"}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2 rounded-full bg-background border border-border/50 shadow-sm">
                  <ArrowDownToLine className="w-4 h-4 text-primary shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MainContainer>
  );
}
