'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, LayoutGrid, List, DiscAlbum } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { fetchAlbums, createAlbum } from '@/lib/api';
import { useAlbumStore } from '@/store/useAlbumStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { MainContainer } from '@/components/layout/MainContainer';
import { AlbumSkeleton } from '@/components/atoms/AlbumSkeleton';

interface Album {
  id: string;
  title: string;
  artist: string | null;
  coverUrl: string | null;
  createdAt: string;
  _count?: {
    songs: number;
  };
}

export default function AlbumsClient({ locale }: { locale: string }) {
  const t = useTranslations('Music');
  const { accessToken: appToken, isHydrated, clearSession } = useAuthStore();
  const { albums, setAlbums, isLoading } = useAlbumStore();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');

  const loadAlbums = useCallback(async () => {
    if (!appToken) return;
    try {
      const data = await fetchAlbums(appToken, { cache: 'no-store' });
      setAlbums(data);
    } catch (err: any) {
      console.error('Failed to load albums:', err);
      if (err.message?.includes('401') || err.message?.toLowerCase()?.includes('unauthorized')) {
        clearSession();
        router.push(`/${locale}/login`);
      }
    }
  }, [appToken, setAlbums, clearSession, router, locale]);

  useEffect(() => {
    if (isHydrated && appToken) {
      loadAlbums();
    }
  }, [isHydrated, appToken, loadAlbums]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !appToken) return;
    try {
      const newAlbum = await createAlbum(appToken, { title: newTitle, artist: newArtist });
      setAlbums([...albums, newAlbum]);
      setIsCreating(false);
      setNewTitle('');
      setNewArtist('');
      return newAlbum;
    } catch (err: any) {
      console.error('Failed to create album', err);
      if (err.message?.includes('401') || err.message?.toLowerCase()?.includes('unauthorized')) {
        clearSession();
        router.push(`/${locale}/login`);
      }
    }
  };

  return (
    <MainContainer>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif italic tracking-tight">{t('albums')}</h1>
        <div>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 bg-foreground text-background rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity text-[13px] font-medium">
            <Plus className="w-3.5 h-3.5" />
            {t('create')}
          </button>
        </div>
      </div>

      {albums.length > 0 && (
        <div className="flex justify-end mb-4">
          <div className="flex bg-muted/50 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isLoading && albums.length === 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <AlbumSkeleton key={i} />
          ))}
        </div>
      ) : albums.length > 0 ? (
        <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-4" : "flex flex-col gap-3"}>
          {albums.map((album) => (
            <Link key={album.id} href={`/${locale}/albums/detail?id=${album.id}`} className={viewMode === 'grid' ? "group flex flex-col gap-2" : "group flex items-center gap-4 p-2 rounded-xl hover:bg-muted/50 transition-colors"}>
              <div className={`relative overflow-hidden rounded-xl bg-muted flex items-center justify-center border-[0.5px] border-border group-hover:border-foreground/30 transition-colors duration-200 shrink-0 ${viewMode === 'grid' ? 'aspect-square w-full' : 'w-16 h-16'}`}>
                {album.coverUrl ? (
                  <img src={album.coverUrl} alt={album.title} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <DiscAlbum className={`${viewMode === 'grid' ? 'w-8 h-8' : 'w-6 h-6'} text-muted-foreground`} />
                )}
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <h3 className="text-[15px] font-medium leading-tight truncate group-hover:text-primary transition-colors">{album.title}</h3>
                <p className="text-[13px] text-muted-foreground truncate">{album._count?.songs || 0} {t('songs')} • {new Date(album.createdAt || Date.now()).toLocaleDateString()}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground border-[0.5px] border-dashed border-border rounded-2xl">
          <DiscAlbum className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-[15px] mb-6">{t('no_albums_yet')}</p>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-foreground text-background rounded-lg px-5 py-2.5 font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            {t('create_first_album')}
          </button>
        </div>
      )}

      {isCreating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">{t('create_new_album')}</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <input 
                type="text" 
                placeholder={t('album_title')} 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="px-3 py-2 bg-muted rounded-lg border border-border text-foreground"
                required
              />
              <input 
                type="text" 
                placeholder={t('artist_optional')} 
                value={newArtist}
                onChange={(e) => setNewArtist(e.target.value)}
                className="px-3 py-2 bg-muted rounded-lg border border-border text-foreground"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-lg hover:bg-muted font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 font-medium"
                >
                  {t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainContainer>
  );
}
