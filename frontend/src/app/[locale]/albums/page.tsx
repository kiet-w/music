'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Upload, LayoutGrid, List, DiscAlbum } from 'lucide-react';
import { fetchAlbums, createAlbum } from '@/lib/api';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { DrivePicker } from '@/components/google-drive/DrivePicker';

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

export default function AlbumsPage({ params: { locale } }: { params: { locale: string } }) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');

  // Google Drive integration
  const { login, listFiles, accessToken, files, isLoading: isDriveLoading } = useGoogleDrive();
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);

  useEffect(() => {
    fetchAlbums()
      .then(setAlbums)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (accessToken) {
      listFiles(accessToken);
      setIsDrivePickerOpen(true);
    }
  }, [accessToken, listFiles]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const newAlbum = await createAlbum({ title: newTitle, artist: newArtist });
      setAlbums(prev => [...prev, newAlbum]);
      setIsCreating(false);
      setNewTitle('');
      setNewArtist('');
      return newAlbum;
    } catch (err) {
      console.error('Failed to create album', err);
    }
  };

  const handleImportClick = async () => {
    if (albums.length === 0) {
      console.log('No albums found, prompting to create General album');
      const confirmCreate = confirm('You need at least one album to import songs. Create a "General" album now?');
      if (confirmCreate) {
        const newAlbum = await createAlbum({ title: 'General', artist: 'Various' });
        if (newAlbum) {
          console.log('General album created:', newAlbum.id);
          setAlbums([newAlbum]);
          // Continue to login
        } else {
          console.error('Failed to create General album');
          return;
        }
      } else {
        return;
      }
    }

    console.log('Checking accessToken:', accessToken ? 'Exists' : 'Missing');
    if (!accessToken) {
      console.log('Calling login()...');
      login();
    } else {
      console.log('AccessToken exists, opening picker directly');
      listFiles(accessToken);
      setIsDrivePickerOpen(true);
    }
  };

  return (
    <main className="px-6 py-8 pb-32 min-h-[100dvh] max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif italic tracking-tight">Albums</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleImportClick}
            className="flex items-center gap-1 bg-transparent border-[0.5px] border-border text-foreground rounded-lg px-3 py-1.5 hover:bg-muted transition-colors text-[13px] font-medium"
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 bg-foreground text-background rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity text-[13px] font-medium">
            <Plus className="w-3.5 h-3.5" />
            Create
          </button>
        </div>
      </div>

      {/* View Toggle */}
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

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse flex flex-col gap-2">
              <div className="aspect-square bg-muted rounded-xl"></div>
              <div className="h-4 bg-muted w-3/4 rounded"></div>
              <div className="h-3 bg-muted w-1/2 rounded"></div>
            </div>
          ))}
        </div>
      ) : albums.length > 0 ? (
        <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}>
          {albums.map((album) => (
            <Link key={album.id} href={`/${locale}/albums/${album.id}`} className={viewMode === 'grid' ? "group flex flex-col gap-2" : "group flex items-center gap-4 p-2 rounded-xl hover:bg-muted/50 transition-colors"}>
              <div className={`relative overflow-hidden rounded-xl bg-muted flex items-center justify-center border-[0.5px] border-border group-hover:border-foreground/30 transition-colors duration-200 shrink-0 ${viewMode === 'grid' ? 'aspect-square w-full' : 'w-16 h-16'}`}>
                {album.coverUrl ? (
                  <img src={album.coverUrl} alt={album.title} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <DiscAlbum className={`${viewMode === 'grid' ? 'w-8 h-8' : 'w-6 h-6'} text-muted-foreground`} />
                )}
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <h3 className="text-[15px] font-medium leading-tight truncate group-hover:text-primary transition-colors">{album.title}</h3>
                <p className="text-[13px] text-muted-foreground truncate">{album._count?.songs || 0} songs • {new Date(album.createdAt || Date.now()).toLocaleDateString()}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground border-[0.5px] border-dashed border-border rounded-2xl">
          <DiscAlbum className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-[15px] mb-6">Chưa có album nào.</p>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-foreground text-background rounded-lg px-5 py-2.5 font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            Tạo album đầu tiên
          </button>
        </div>
      )}

      {/* Create Album Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-xl p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">Create New Album</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <input 
                type="text" 
                placeholder="Album Title" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="px-3 py-2 bg-muted rounded-lg border border-border text-foreground"
                required
              />
              <input 
                type="text" 
                placeholder="Artist (Optional)" 
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drive Picker Modal */}
      <DrivePicker 
        isOpen={isDrivePickerOpen}
        onClose={() => setIsDrivePickerOpen(false)}
        accessToken={accessToken}
        files={files}
        isLoading={isDriveLoading}
        albumId={albums[0]?.id}
        albums={albums}
        onImportComplete={() => {
          fetchAlbums().then(setAlbums);
        }}
      />
    </main>
  );
}

