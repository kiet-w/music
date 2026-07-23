'use client';

// ponytail: youtube converter section wrapper for music import modal
import React from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const Downloader = dynamic(() => import('@/components/features/music/youtube/Downloader'), {
  ssr: false,
  loading: () => <div className="h-[200px] bg-zinc-900/50 animate-pulse rounded-2xl" />,
});

export interface YoutubeSectionProps {
  onSuccess?: () => void;
}

export function YoutubeSection({ onSuccess }: YoutubeSectionProps) {
  return (
    <motion.section
      key="youtube"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="space-y-3"
    >
      <div className="bg-transparent p-0 relative overflow-hidden">
        <Downloader onDownloadStarted={onSuccess} />
      </div>
    </motion.section>
  );
}

export default YoutubeSection;
