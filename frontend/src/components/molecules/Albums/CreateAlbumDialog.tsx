'use client';

import React from 'react';
import { ImageUploader } from '@/components/ui/ImageUploader';

interface CreateAlbumDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newTitle: string;
  setNewTitle: (value: string) => void;
  coverUrl?: string | null;
  setCoverUrl?: (value: string | null) => void;
  onCoverFileSelect?: (file: File | null) => void;
  newArtist?: string;
  setNewArtist?: (value: string) => void;
  t: (key: string) => string;
}

export function CreateAlbumDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  newTitle, 
  setNewTitle, 
  coverUrl,
  setCoverUrl,
  onCoverFileSelect,
  t 
}: CreateAlbumDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="glass-dark border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-6">{t('create_new_album') || 'Tạo Album mới'}</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder={t('album_title') || 'Nhập tên Album...'} 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 rounded-2xl border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 transition-all text-sm sm:text-base font-medium"
              required
              autoFocus
            />

            <ImageUploader
              label="Ảnh bìa Album (Tùy chọn):"
              placeholder="Chọn hoặc kéo thả ảnh bìa album vào đây..."
              value={coverUrl}
              onChange={(file, previewUrl) => {
                if (setCoverUrl) setCoverUrl(previewUrl);
                if (onCoverFileSelect) onCoverFileSelect(file);
              }}
              onClear={() => {
                if (setCoverUrl) setCoverUrl(null);
                if (onCoverFileSelect) onCoverFileSelect(null);
              }}
              aspectRatio="square"
            />
          </div>
          
          <div className="flex justify-end gap-3 mt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3 rounded-xl hover:bg-white/10 text-white/60 hover:text-white font-medium transition-colors text-sm cursor-pointer"
            >
              Hủy
            </button>
            <button 
              type="submit"
              className="px-8 py-3 bg-white hover:bg-white/90 text-black font-bold rounded-xl transition-all shadow-lg shadow-white/10 text-sm cursor-pointer"
            >
              {t('create') || 'Tạo Album'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
