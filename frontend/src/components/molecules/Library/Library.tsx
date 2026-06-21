'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Play, Plus, Trash2, FolderInput, Download, CheckCircle2, Loader2, X } from 'lucide-react';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { Button } from '@/components/atoms/ui/button';
import { cn } from '@/lib/utils';
import { fetchTracks, deleteTrack, moveTrackToAlbum } from '@/lib/api';
import dynamic from 'next/dynamic';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { useAuthStore } from '@/store/useAuthStore';
import { useAlbumStore } from '@/store/useAlbumStore';
import { toast } from 'sonner';

const AddToPlaylistDialog = dynamic(() => import('../AddToPlaylist/AddToPlaylistDialog'), {
  ssr: false,
});

const PlayingVisualizer = dynamic(() => import('./PlayingVisualizer'), {
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

const TrackDuration = ({ trackUrl, initialDuration, formatDuration }: { trackUrl: string; initialDuration: number | null; formatDuration: (seconds: number | null) => string }) => {
  const [duration, setDuration] = useState<number | null>(initialDuration);

  useEffect(() => {
    if ((initialDuration === null || isNaN(initialDuration)) && trackUrl) {
      const audio = new Audio(trackUrl);
      audio.preload = 'metadata';
      const onLoadedMetadata = () => {
        setDuration(audio.duration);
      };
      audio.addEventListener('loadedmetadata', onLoadedMetadata);
      return () => {
        audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        audio.src = '';
      };
    } else {
      setDuration(initialDuration);
    }
  }, [initialDuration, trackUrl]);

  return <>{formatDuration(duration)}</>;
};

export default function Library({ onTrackSelect, currentTrackId, albumId }: LibraryProps) {
  const t = useTranslations('Music');
  const { accessToken, user, isHydrated } = useAuthStore();
  const { albums } = useAlbumStore();
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    track: Track | null;
  }>({
    isOpen: false,
    track: null,
  });
  const [moveModalState, setMoveModalState] = useState<{
    isOpen: boolean;
    track: Track | null;
  }>({
    isOpen: false,
    track: null,
  });

  const confirmDelete = async () => {
    const { track } = deleteModalState;
    if (!track || !accessToken) return;
    try {
      await deleteTrack(accessToken, track.id);
      toast.success(t('delete_success') || 'Đã xóa bài hát khỏi thư viện.');
      loadTracks();
    } catch (error: any) {
      console.error('Error deleting track:', error);
      toast.error(error.message || 'Lỗi khi xóa bài hát.');
    } finally {
      setDeleteModalState({ isOpen: false, track: null });
    }
  };

  const confirmMove = async (targetAlbumId: string) => {
    const { track } = moveModalState;
    if (!track || !accessToken) return;
    try {
      await moveTrackToAlbum(accessToken, track.id, targetAlbumId);
      toast.success(t('move_success') || 'Đã di chuyển bài hát sang album mới.');
      loadTracks();
    } catch (error: any) {
      console.error('Error moving track:', error);
      toast.error(error.message || 'Lỗi khi di chuyển bài hát.');
    } finally {
      setMoveModalState({ isOpen: false, track: null });
    }
  };
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
      })
      .finally(() => setLoading(false));
  }, [albumId, accessToken, isHydrated]);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const handleRealtimeTrackChange = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    // If we're inside a specific album, filter out changes that don't belong to this album
    if (albumId && eventType !== 'DELETE' && newRecord.albumId !== albumId) {
      return;
    }

    setTracks((prevTracks) => {
      switch (eventType) {
        case 'INSERT': {
          if (prevTracks.some(t => t.id === newRecord.id)) return prevTracks;
          return [newRecord as Track, ...prevTracks];
        }
        case 'UPDATE':
          return prevTracks.map((track) =>
            track.id === newRecord.id ? { ...track, ...newRecord } : track
          );
        case 'DELETE':
          return prevTracks.filter((track) => track.id !== oldRecord.id);
        default:
          return prevTracks;
      }
    });
  }, [albumId]);

  useSupabaseRealtime(
    accessToken && user?.id ? 'Track' : '',
    handleRealtimeTrackChange,
    user?.id ? `userId=eq.${user.id}` : undefined
  );


  const handleAddToPlaylist = useCallback((e: React.MouseEvent, title: string) => {
    e.stopPropagation();
    setDialogState({ isOpen: true, songTitle: title });
  }, []);

  const handleDeleteClick = useCallback((e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    if (!accessToken) return;
    setDeleteModalState({ isOpen: true, track });
  }, [accessToken]);

  const handleMoveClick = useCallback((e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    if (!accessToken) return;
    setMoveModalState({ isOpen: true, track });
  }, [accessToken]);

  const formatDuration = useCallback((seconds: number | null) => {
    if (seconds === null || isNaN(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const { memoizedTracks, totalDuration } = React.useMemo(() => {
    const validTracks = tracks.filter(t => t.url);
    const duration = validTracks.reduce((acc, track) => acc + (track.duration || 0), 0);
    return { memoizedTracks: validTracks, totalDuration: duration };
  }, [tracks]);

  const stats = React.useMemo(() => ({
    count: tracks.length,
    formattedTotal: formatDuration(totalDuration)
  }), [tracks.length, totalDuration, formatDuration]);

  if (loading) return <div className="p-8 text-center text-muted-foreground italic animate-pulse">Loading library...</div>;

  return (
    <div className="w-full">
      {tracks.length > 0 && (
        <div 
          className="flex items-center gap-2 mb-4 px-4 py-2 bg-secondary/5 rounded-lg border border-secondary/10"
        >
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
                "group flex justify-between items-center p-3 px-4 rounded-xl transition-all duration-300 gap-3",
                isFailed ? "opacity-50 grayscale cursor-not-allowed bg-red-500/5" : "bg-secondary/5 hover:bg-secondary/10 active:scale-[0.98] cursor-pointer",
                isActive && "bg-primary/10 shadow-glow"
              )}
              onClick={() => !isFailed && handleTrackSelect(track)}
            >
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className={cn(
                  "block font-medium leading-tight truncate transition-colors",
                  isActive ? "text-primary" : isFailed ? "text-red-400" : "text-foreground/90 group-hover:text-primary"
                )}>
                  {track.title} {isFailed && '(Processing Failed)'}
                </span>
                <span className="block text-xs text-muted-foreground truncate">
                  {track.artist || track.album?.title || 'Unknown Artist'}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                <span className="text-[10px] text-muted-foreground/60 font-medium tracking-wider mr-1">
                  {isFailed ? 'Error' : <TrackDuration trackUrl={track.url} initialDuration={track.duration} formatDuration={formatDuration} />}
                </span>
                {!isFailed && (
                  <div className="flex items-center gap-1">
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
                      {isActive ? (
                        <PlayingVisualizer />
                      ) : <Play size={14} className="ml-0.5" />}
                    </Button>
                  </div>
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

      {/* Custom Delete Modal */}
      {deleteModalState.isOpen && deleteModalState.track && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div
            onClick={() => setDeleteModalState({ isOpen: false, track: null })}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md p-6 mx-4 animate-in zoom-in-95 duration-200">
            <div className="glass-dark rounded-3xl p-6 shadow-soft border border-white/10 text-center">
              <h3 className="text-xl font-bold text-white mb-2">{t('delete_warning') || 'Xóa bài hát?'}</h3>
              <p className="text-sm text-white/60 mb-6">
                Bạn có chắc chắn muốn xóa bài hát "{deleteModalState.track.title}" khỏi thư viện? Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={() => setDeleteModalState({ isOpen: false, track: null })}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-xl py-3"
                >
                  Hủy
                </Button>
                <Button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-3 font-bold"
                >
                  Xóa
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Move Modal */}
      {moveModalState.isOpen && moveModalState.track && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div
            onClick={() => setMoveModalState({ isOpen: false, track: null })}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md p-6 mx-4 animate-in zoom-in-95 duration-200">
            <div className="glass-dark rounded-3xl p-6 shadow-soft border border-white/10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">{t('select_album') || 'Di chuyển bài hát'}</h3>
                  <p className="text-sm text-white/40 mt-1">Chọn album cho "{moveModalState.track.title}"</p>
                </div>
                <button
                  onClick={() => setMoveModalState({ isOpen: false, track: null })}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} className="text-white/60" />
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                {albums && albums.length > 0 ? (
                  albums.map((album: any) => (
                    <button
                      key={album.id}
                      onClick={() => confirmMove(album.id)}
                      className="flex items-center justify-between p-4 rounded-xl border border-transparent bg-white/5 hover:bg-white/10 hover:border-white/10 text-white/80 transition-all text-left"
                    >
                      <div>
                        <div className="font-semibold text-sm">{album.title}</div>
                        {album.artist && <div className="text-xs text-white/40">{album.artist}</div>}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-white/40 p-4 text-center">
                    Không tìm thấy album nào. Vui lòng tạo album trước.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
