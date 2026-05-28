'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Library } from '@/components/molecules/Library/Library';
import { Button } from '@/components/atoms/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { usePlayerStore } from '@/store/usePlayerStore';
import { fetchAlbum, fetchAlbums } from '@/lib/api';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { Upload } from 'lucide-react';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { DrivePicker } from '@/components/google-drive/DrivePicker';

interface AlbumDetailClientProps {
  locale: string;
  id: string;
  album: {
    id: string;
    title: string;
    artist: string;
  };
}

export default function AlbumDetailClient({ locale, id, album: initialAlbum }: AlbumDetailClientProps) {
  const t = useTranslations('Music');
  const { play, currentTrack } = usePlayerStore();
  const [album, setAlbum] = useState(initialAlbum);
  const [albums, setAlbums] = useState<any[]>([]);

  // Google Drive integration
  const { login, listFiles, accessToken, files, isLoading: isDriveLoading } = useGoogleDrive();
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);

  useEffect(() => {
    fetchAlbums().then(setAlbums);
  }, []);

  useEffect(() => {
    if (accessToken) {
      listFiles(accessToken);
      setIsDrivePickerOpen(true);
    }
  }, [accessToken, listFiles]);

  const loadAlbum = useCallback(async () => {
    try {
      const data = await fetchAlbum(id);
      setAlbum(data);
    } catch (err) {
      console.error('Failed to reload album:', err);
    }
  }, [id]);

  const handleImportClick = () => {
    if (!accessToken) {
      login();
    } else {
      listFiles(accessToken);
      setIsDrivePickerOpen(true);
    }
  };

  useSupabaseRealtime('Album', loadAlbum);
  useSupabaseRealtime('Track', loadAlbum);

  return (
    <main className="p-4 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <Link href={`/${locale}`}>
          <Button variant="ghost" size="sm" className="-ml-2">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t('title')}
          </Button>
        </Link>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleImportClick}
          className="flex items-center gap-2 border-white/10 hover:bg-white/5"
        >
          <Upload className="w-4 h-4" />
          <span>Import từ Drive</span>
        </Button>
      </div>

      <div className="flex items-center space-x-6">
        <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs text-center p-2 shadow-lg">
          {album.title}
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{album.title}</h1>
          <p className="text-muted-foreground">{album.artist}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('tracks')}</h2>
        <Library 
          onTrackSelect={play} 
          currentTrackId={currentTrack?.id} 
          albumId={id}
        />
      </div>

      {/* Drive Picker Modal */}
      <DrivePicker 
        isOpen={isDrivePickerOpen}
        onClose={() => setIsDrivePickerOpen(false)}
        accessToken={accessToken}
        files={files}
        isLoading={isDriveLoading}
        albumId={id}
        albums={albums.length > 0 ? albums : [album]}
        onImportComplete={loadAlbum}
      />
    </main>
  );
}
