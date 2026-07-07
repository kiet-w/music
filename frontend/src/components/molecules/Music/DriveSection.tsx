'use client';

import React from 'react';
import { HardDrive, Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AlbumBasic } from '@/types/album';

interface DriveSectionProps {
  onBrowseClick: () => void;
  isCheckingConnection: boolean;
  isDriveLoading: boolean;
  selectedAlbumId: string;
  setSelectedAlbumId: (id: string) => void;
  albums: AlbumBasic[];
  t: (key: string) => string;
}

export function DriveSection({
  onBrowseClick,
  isCheckingConnection,
  isDriveLoading,
  selectedAlbumId,
  setSelectedAlbumId,
  albums,
  t
}: DriveSectionProps) {
  return (
    <motion.section 
      key="drive"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="bg-card border-[0.5px] border-border p-12 rounded-[2.5rem] flex flex-col items-center text-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-500 relative z-10">
          <HardDrive size={32} />
        </div>
        <div className="space-y-2 relative z-10">
          <h3 className="text-xl font-bold">{t('drive_title')}</h3>
          <p className="text-muted-foreground text-sm max-w-[280px]">
            {t('drive_description')}
          </p>
        </div>
        
        <button 
          onClick={onBrowseClick}
          disabled={isCheckingConnection || isDriveLoading}
          className="bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-blue-500/25 relative z-10 disabled:opacity-50"
        >
          {isCheckingConnection || isDriveLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search size={20} />
          )}
          <span>{t('browse_drive')}</span>
        </button>
        
        <div className="mt-4 pt-6 border-t border-border/50 w-full flex flex-col gap-2 relative z-10">
           <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">{t('default_album')}</p>
           <select 
            value={selectedAlbumId}
            onChange={(e) => setSelectedAlbumId(e.target.value)}
            className="w-full bg-muted/50 border-border rounded-xl py-2.5 px-4 text-xs focus:outline-none transition-all appearance-none cursor-pointer font-medium"
          >
            {albums.map((album) => (
              <option key={album.id} value={album.id}>
                Album: {album.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </motion.section>
  );
}
