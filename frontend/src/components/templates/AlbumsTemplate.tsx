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
      <div className="flex flex-col gap-6 mb-12 mt-4">
        <div className="flex items-end justify-between">
          <h1 className="font-instrument text-4xl md:text-5xl tracking-tighter leading-none">{t('albums')}</h1>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 bg-foreground text-background rounded-full px-4 py-2 hover:opacity-90 transition-all active:scale-95 text-sm font-medium shadow-lg shadow-foreground/10">
            <Plus size={16} strokeWidth={1.5} />
            {t('create')}
          </button>
        </div>
        
        {albums.length > 0 && (
          <div className="flex justify-between items-center border-b border-border/50 pb-4">
            <p className="text-sm text-muted-foreground font-sans">
              {t('collection_count', { count: albums.length })}
            </p>
            <div className="flex bg-muted/30 p-1 rounded-full border border-border/50">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-full transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <LayoutGrid size={18} strokeWidth={1.5} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-full transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <List size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}
      </div>

      {isLoading && albums.length === 0 ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-10">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={i % 2 === 0 ? "mt-12" : ""}>
              <AlbumSkeleton />
            </div>
          ))}
        </div>
      ) : albums.length > 0 ? (
        <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-x-6 gap-y-10" : "flex flex-col gap-4"}>
          {albums.map((album, index) => (
            <div
              key={album.id}
              className={viewMode === 'grid' && index % 2 === 1 ? "mt-12" : ""}
            >
              <Link 
                href={`/${locale}/albums/detail?id=${album.id}`} 
                className={viewMode === 'grid' 
                  ? "group flex flex-col gap-3" 
                  : "group flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/30 transition-all border border-transparent hover:border-border/50"}
              >
                <div className={`relative overflow-hidden rounded-2xl bg-muted flex items-center justify-center border-[0.5px] border-white/10 group-hover:border-white/20 transition-all duration-500 ease-out shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] ${viewMode === 'grid' ? 'aspect-[3/4] w-full shadow-sm group-hover:scale-[1.02]' : 'w-20 h-20 shadow-sm'}`}>
                  {album.coverUrl ? (
                    <img src={album.coverUrl} alt={album.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <DiscAlbum size={viewMode === 'grid' ? 40 : 32} strokeWidth={1.5} className="text-muted-foreground/30" />
                  )}
                </div>
                <div className={`space-y-1 flex-1 min-w-0 ${viewMode === 'grid' ? 'pr-2' : ''}`}>
                  <h3 className="text-lg font-medium leading-tight truncate group-hover:text-primary transition-colors">{album.title}</h3>
                  <p className="text-sm text-muted-foreground/80 font-sans tracking-wide">
                    {album._count?.songs || 0} {t('songs')} 
                    {viewMode === 'list' && ` • ${new Date(album.createdAt || Date.now()).toLocaleDateString()}`}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
            <DiscAlbum className="w-20 h-20 relative z-10 text-muted-foreground/20" />
          </div>
          <h2 className="text-2xl font-instrument tracking-tight text-foreground mb-3">{t('no_albums_yet')}</h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-[260px] mx-auto font-sans mb-10">
            Organize your library by creating your first custom album.
          </p>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2.5 bg-foreground text-background rounded-full px-8 py-4 font-medium hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-foreground/10">
            <Plus className="w-5 h-5" />
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
                className="px-3 py-2 bg-muted rounded-lg border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
              <input 
                type="text" 
                placeholder={t('artist_optional')} 
                value={newArtist}
                onChange={(e) => setNewArtist(e.target.value)}
                className="px-3 py-2 bg-muted rounded-lg border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-lg hover:bg-muted font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 font-medium transition-opacity"
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
