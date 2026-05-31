'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Play, Plus, Trash2, FolderInput, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { Button } from '@/components/atoms/ui/button';
import { cn } from '@/lib/utils';
import { fetchTracks, deleteTrack, moveTrackToAlbum } from '@/lib/api';
import dynamic from 'next/dynamic';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

const AddToPlaylistDialog = dynamic(() => import('../AddToPlaylist/AddToPlaylistDialog').then(mod => mod.AddToPlaylistDialog), {
  ssr: false,
});

export interface Track {
  id: string;
  title: string;
  artist: string | null;
  url: string;
  duration: number | null;
  coverUrl?: string;
  albumId?: string;
  album?: {
    title: string;
  };
}

interface LibraryProps {
  onTrackSelect: (track: Track, localUrl?: string) => void;
  currentTrackId?: string;
  albumId?: string;
}

export const Library: React.FC<LibraryProps> = ({ onTrackSelect, currentTrackId, albumId }) => {
  const t = useTranslations('Music');
  const router = useRouter();
  const locale = useLocale();
  const { accessToken, isHydrated, clearSession } = useAuthStore();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogState, setDialogState] = useState<{ isOpen: boolean; songTitle: string }>({
    isOpen: false,
    songTitle: '',
  });

  const { offlineTracks, downloadTrack, removeTrack, getLocalUri } = useOfflineStorage();
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const handleDownload = async (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    if (downloadingIds.has(track.id)) return;

    setDownloadingIds(prev => new Set(prev).add(track.id));
    await downloadTrack(track.id, track.url);
    setDownloadingIds(prev => {
      const next = new Set(prev);
      next.delete(track.id);
      return next;
    });
  };

  const handleRemoveOffline = async (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    await removeTrack(trackId);
  };

  const handleTrackSelect = async (track: Track) => {
    const localUri = await getLocalUri(track.id);
    onTrackSelect(track, localUri || undefined);
  };

  const loadTracks = useCallback(() => {
    if (!isHydrated) return;
    if (!accessToken) {
      setLoading(false);
      return;
    }

    fetchTracks(accessToken)
      .then((data: Track[]) => {
        if (albumId) {
          setTracks(data.filter(t => t.albumId === albumId));
        } else {
          setTracks(data);
        }
      })
      .catch((err) => {
        console.error('Error fetching tracks:', err);
        if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
          clearSession();
          router.push(`/${locale}/login`);
        }
      })
      .finally(() => setLoading(false));
  }, [albumId, accessToken, isHydrated, clearSession, router, locale]);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  useSupabaseRealtime(accessToken ? 'Track' : '', loadTracks);


  const handleAddToPlaylist = useCallback((e: React.MouseEvent, title: string) => {
    e.stopPropagation();
    setDialogState({ isOpen: true, songTitle: title });
  }, []);

  const handleDeleteClick = useCallback(async (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    if (!accessToken) return;

    if (window.confirm(t('delete_warning'))) {
      try {
        await deleteTrack(accessToken, track.id);
        loadTracks();
      } catch (error: any) {
        console.error('Error deleting track:', error);
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          clearSession();
          router.push(`/${locale}/login`);
        }
      }
    }
  }, [loadTracks, t, accessToken, clearSession, router, locale]);

  const handleMoveClick = useCallback(async (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    if (!accessToken) return;

    const targetAlbumId = window.prompt(t('select_album'));
    if (targetAlbumId) {
      try {
        await moveTrackToAlbum(accessToken, track.id, targetAlbumId);
        loadTracks();
      } catch (error: any) {
        console.error('Error moving track:', error);
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          clearSession();
          router.push(`/${locale}/login`);
        }
      }
    }
  }, [loadTracks, t, accessToken, clearSession, router, locale]);

  const formatDuration = useCallback((seconds: number | null) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const { memoizedTracks, totalDuration } = React.useMemo(() => {
    const duration = tracks.reduce((acc, track) => acc + (track.duration || 0), 0);
    return { memoizedTracks: tracks, totalDuration: duration };
  }, [tracks]);

  const stats = React.useMemo(() => ({
    count: tracks.length,
    formattedTotal: formatDuration(totalDuration)
  }), [tracks.length, totalDuration, formatDuration]);

  if (loading) return <div className="p-8 text-center text-muted-foreground italic">Loading library...</div>;

  return (
    <div className="w-full">
      {tracks.length > 0 && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-secondary/5 rounded-lg border border-secondary/10">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider opacity-70">
            Library Stats
          </span>
          <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          <span className="text-xs text-muted-foreground font-medium">
            Total: {stats.count} songs • {stats.formattedTotal} total time
          </span>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {memoizedTracks.map((track) => {
          const isActive = currentTrackId === track.id;
          const isFailed = !track.url;
          const isDownloaded = offlineTracks.has(track.id);
          const isDownloading = downloadingIds.has(track.id);
          
          return (
            <div 
              key={track.id} 
              className={cn(
                "group flex justify-between items-center p-3 px-4 rounded-xl transition-all duration-300",
                isFailed ? "opacity-50 grayscale cursor-not-allowed bg-red-500/5" : "bg-secondary/5 hover:bg-secondary/10 active:scale-[0.98] cursor-pointer",
                isActive && "bg-primary/10 shadow-glow"
              )}
              onClick={() => !isFailed && handleTrackSelect(track)}
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className={cn(
                  "font-medium leading-tight truncate transition-colors",
                  isActive ? "text-primary" : isFailed ? "text-red-400" : "text-foreground/90 group-hover:text-primary"
                )}>
                  {track.title} {isFailed && '(Processing Failed)'}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {track.artist || track.album?.title || 'Unknown Artist'}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] text-muted-foreground/60 font-medium tracking-wider mr-2">
                  {isFailed ? 'Error' : formatDuration(track.duration)}
                </span>
                {!isFailed && (
                  <>
                    {isDownloading ? (
                      <Loader2 size={14} className="text-primary animate-spin mr-1" />
                    ) : isDownloaded ? (
                      <div className="flex items-center gap-1" title="Downloaded for offline">
                        <CheckCircle2 size={14} className="text-green-500" />
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 bg-secondary/20 transition-all hover:bg-orange-500/20 hover:text-orange-500"
                          onClick={(e) => handleRemoveOffline(e, track.id)}
                          title="Remove Download"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 bg-secondary/20 transition-all hover:bg-primary/20 hover:text-primary"
                        onClick={(e) => handleDownload(e, track)}
                        title="Download for Offline"
                      >
                        <Download size={14} />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 bg-secondary/20 transition-all hover:bg-primary/20 hover:text-primary"
                      onClick={(e) => handleMoveClick(e, track)}
                      title="Move to Folder"
                    >
                      <FolderInput size={14} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 bg-secondary/20 transition-all hover:bg-red-500/20 hover:text-red-500"
                      onClick={(e) => handleDeleteClick(e, track)}
                      title="Delete Track"
                    >
                      <Trash2 size={14} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 bg-secondary/20 transition-all hover:bg-primary/20 hover:text-primary"
                      onClick={(e) => handleAddToPlaylist(e, track.title)}
                    >
                      <Plus size={14} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "h-8 w-8 p-0 rounded-full transition-all",
                        !isActive && "opacity-0 group-hover:opacity-100 bg-secondary/20"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrackSelect(track);
                      }}
                    >
                      {isActive ? <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-pulse" /> : <Play size={14} className="ml-0.5" />}
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {tracks.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No tracks found in your library.
          </div>
        )}
      </div>

      <AddToPlaylistDialog 
        isOpen={dialogState.isOpen}
        songTitle={dialogState.songTitle}
        onClose={() => setDialogState({ ...dialogState, isOpen: false })}
      />
    </div>
  );
};
