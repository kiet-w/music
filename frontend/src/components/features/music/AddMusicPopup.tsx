'use client';

// ponytail: clean inner music import popup component (zero heavy outline borders, studio black & white design)
import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { MusicTabSwitcher } from '@/components/features/music/MusicTabSwitcher';
import { YoutubeSection } from '@/components/features/music/youtube/YoutubeSection';
import { DriveSection } from '@/components/features/music/drive/DriveSection';

export interface AddMusicPopupProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'youtube' | 'drive';
  onSuccess?: () => void;
}

export function AddMusicPopup({
  isOpen,
  onClose,
  defaultTab = 'youtube',
  onSuccess,
}: AddMusicPopupProps) {
  const [activeTab, setActiveTab] = useState<'youtube' | 'drive'>(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden text-white">
      {/* Modal Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base tracking-tight text-white font-instrument">Thêm Nhạc Mới</h3>
            <p className="text-[11px] text-zinc-400 font-sans">
              Tải nhạc từ YouTube hoặc Google Drive
            </p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="py-3 shrink-0">
        <MusicTabSwitcher activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Scrollable Tab Content Body */}
      <div className="flex-1 overflow-y-auto pr-0.5 scrollbar-hide">
        <AnimatePresence mode="wait">
          {activeTab === 'youtube' ? (
            <YoutubeSection key="youtube-section" onSuccess={onSuccess} />
          ) : (
            <DriveSection key="drive-section" onSuccess={onSuccess} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AddMusicPopup;
