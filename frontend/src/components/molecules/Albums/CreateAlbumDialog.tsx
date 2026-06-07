'use client';

import React from 'react';

interface CreateAlbumDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newTitle: string;
  setNewTitle: (value: string) => void;
  newArtist: string;
  setNewArtist: (value: string) => void;
  t: (key: string) => string;
}

export function CreateAlbumDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  newTitle, 
  setNewTitle, 
  newArtist, 
  setNewArtist, 
  t 
}: CreateAlbumDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-background border border-border/50 rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
        <h2 className="text-2xl font-instrument tracking-tight mb-6">{t('create_new_album')}</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder={t('album_title')} 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-4 py-3 bg-muted/50 rounded-2xl border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all"
              required
            />
            <input 
              type="text" 
              placeholder={t('artist_optional')} 
              value={newArtist}
              onChange={(e) => setNewArtist(e.target.value)}
              className="w-full px-4 py-3 bg-muted/50 rounded-2xl border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all"
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3 rounded-full hover:bg-muted font-medium transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-8 py-3 bg-foreground text-background rounded-full hover:opacity-90 font-medium transition-opacity shadow-lg shadow-foreground/10 text-sm"
            >
              {t('create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
