'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const Downloader = dynamic(() => import('@/components/molecules/Downloader/Downloader'), {
  ssr: false,
  loading: () => <div className="h-[200px] bg-muted animate-pulse rounded-[2rem]" />
});

export function YoutubeSection() {
  return (
    <motion.section 
      key="youtube"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="bg-card border-[0.5px] border-border p-6 rounded-[2.5rem] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16" />
        <Downloader />
      </div>
    </motion.section>
  );
}
