'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Play, Plus, Trash2, FolderInput, Download, CheckCircle2, Loader2, X, MoreVertical } from 'lucide-react';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fetchTracks, deleteTrack, moveTrackToAlbum } from '@/lib/api';
import dynamic from 'next/dynamic';
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

const TrackDuration = React.memo(({ trackUrl, initialDuration, formatDuration }: { trackUrl: string; initialDuration: number | null; formatDuration: (seconds: number | null) => string }) => {
  return <>{formatDuration(initialDuration)}</>;
});

export default function Library({ onTrackSelect, currentTrackId, albumId }: LibraryProps) {
  const t = useTranslations('Music');
  const { accessToken, user, isHydrated } = useAuthStore();
  const { albums } = useAlbumStore();

  // Action Popup Modal State for Long-Press / 3-dots Menu
  const [actionModalState, setActionModalState] = useState<{
    isOpen: boolean;
    track: Track | null;
  }>({
    isOpen: false,
    track: null,
  });

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef<boolean>(false);

  const handleTouchStart = (track: Track) => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
      setActionModalState({ isOpen: true, track });
    }, 450);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

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

  const getEffectiveToken = useCallback(() => {
    if (accessToken) return accessToken;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('music.auth');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.accessToken || parsed.state?.accessToken || null;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  }, [accessToken]);

  const confirmDelete = async () => {
    const { track } = deleteModalState;
    const token = getEffectiveToken();
    if (!track || !token) {
      toast.error('Vui lòng kiểm tra đăng nhập');
      setDeleteModalState({ isOpen: false, track: null });
      return;
    }
    try {
      await deleteTrack(token, track.id);
      toast.success(t('delete_success') || 'Đã xóa bài hát khỏi thư viện.');
      setTracks((prev) => prev.filter((t) => t.id !== track.id));
    } catch (error: any) {
      console.error('Error deleting track:', error);
      toast.error(error?.message || 'Lỗi khi xóa bài hát.');
    } finally {
      setDeleteModalState({ isOpen: false, track: null });
    }
  };

  const confirmMove = async (targetAlbumId: string) => {
    const { track } = moveModalState;
    const token = getEffectiveToken();
    if (!track || !token) {
      toast.error('Vui lòng kiểm tra đăng nhập');
      setMoveModalState({ isOpen: false, track: null });
      return;
    }
    try {
      await moveTrackToAlbum(token, track.id, targetAlbumId);
      toast.success(t('move_success') || 'Đã di chuyển bài hát sang album mới.');
      loadTracks();
    } catch (error: any) {
      console.error('Error moving track:', error);
      toast.error(error?.message || 'Lỗi khi di chuyển bài hát.');
    } finally {
      setMoveModalState({ isOpen: false, track: null });
    }
  };

  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogState, setDialogState] = useState<{ isOpen: boolean; songTitle: string; songId?: string }>({
    isOpen: false,
    songTitle: '',
    songId: undefined,
  });

  const { offlineTracks, downloadTrack, removeTrack, getLocalUri, isSupported } = useOfflineStorage();
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
    const token = getEffectiveToken();
    if (!token) {
      setLoading(false);
      return;
    }

    fetchTracks(token, albumId)
      .then((data: Track[]) => {
        setTracks(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Error fetching tracks:', err);
        setTracks([]);
      })
      .finally(() => setLoading(false));
  }, [albumId, getEffectiveToken, isHydrated]);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const handleAddToPlaylist = useCallback((e: React.MouseEvent, title: string, songId?: string) => {
    e.stopPropagation();
    setDialogState({ isOpen: true, songTitle: title, songId });
  }, []);

  const handleDeleteClick = useCallback((e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    setDeleteModalState({ isOpen: true, track });
  }, []);

  const handleMoveClick = useCallback((e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    setMoveModalState({ isOpen: true, track });
  }, []);

  const formatDuration = useCallback((seconds: number | null) => {
    if (seconds === null || isNaN(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const safeTracks = React.useMemo(() => (Array.isArray(tracks) ? tracks : []), [tracks]);

  const { memoizedTracks, totalDuration } = React.useMemo(() => {
    const validTracks = safeTracks.filter(t => t?.url);
    const duration = validTracks.reduce((acc, track) => acc + (track?.duration || 0), 0);
    return { memoizedTracks: validTracks, totalDuration: duration };
  }, [safeTracks]);

  const stats = React.useMemo(() => ({
    count: safeTracks.length,
    formattedTotal: formatDuration(totalDuration)
  }), [safeTracks.length, totalDuration, formatDuration]);

  if (loading) return <div className="p-8 text-center text-muted-foreground italic animate-pulse">Loading library...</div>;

  return (
    <div className="w-full">
      {safeTracks.length > 0 && (
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

          return (
            <div 
              key={track.id} 
              className={cn(
                "group flex justify-between items-center p-3.5 px-4 rounded-2xl transition-all duration-200 gap-3 relative select-none",
                isFailed ? "opacity-50 grayscale cursor-not-allowed bg-red-500/5" : "bg-secondary/5 hover:bg-secondary/10 active:scale-[0.99] cursor-pointer",
                isActive && "bg-primary/10 border border-emerald-500/20"
              )}
              onTouchStart={() => handleTouchStart(track)}
              onTouchEnd={handleTouchEnd}
              onMouseDown={() => handleTouchStart(track)}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              onContextMenu={(e) => {
                e.preventDefault();
                setActionModalState({ isOpen: true, track });
              }}
              onClick={(e) => {
                if (isLongPressRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                  isLongPressRef.current = false;
                  return;
                }
                if (!isFailed) handleTrackSelect(track);
              }}
            >
              <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-2">
                <span className={cn(
                  "block font-semibold leading-tight truncate transition-colors text-sm sm:text-base",
                  isActive ? "text-primary font-bold" : isFailed ? "text-red-400" : "text-foreground/90 group-hover:text-primary"
                )}>
                  {track.title} {isFailed && '(Processing Failed)'}
                </span>
                <span className="block text-xs text-muted-foreground/80 truncate">
                  {track.artist || track.album?.title || 'Unknown Artist'}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                {isActive && (
                  <div className="mr-1">
                    <PlayingVisualizer />
                  </div>
                )}

                {isDownloaded && (
                  <span title="Downloaded">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  </span>
                )}

                <span className="text-xs text-muted-foreground/70 font-mono tracking-wider">
                  {isFailed ? 'Error' : <TrackDuration trackUrl={track.url} initialDuration={track.duration} formatDuration={formatDuration} />}
                </span>

                {!isFailed && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActionModalState({ isOpen: true, track });
                    }}
                    className="p-1.5 hover:bg-white/10 text-white/40 hover:text-white rounded-full transition-colors shrink-0 ml-1"
                    title="Menu tùy chọn"
                  >
                    <MoreVertical size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {safeTracks.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No tracks found in your library.
          </div>
        )}
      </div>

      {/* Track Options Action Popup Modal (Features Only) */}
      {actionModalState.isOpen && actionModalState.track && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div
            onClick={() => setActionModalState({ isOpen: false, track: null })}
            className="absolute inset-0"
          />
          <div className="relative w-full max-w-xs glass-dark rounded-3xl p-4 shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200 z-10 flex flex-col gap-2">
            {/* Download / Remove Offline */}
            {isSupported !== false && (
              offlineTracks.has(actionModalState.track.id) ? (
                <button
                  onClick={(e) => {
                    const target = actionModalState.track;
                    setActionModalState({ isOpen: false, track: null });
                    if (target) handleRemoveOffline(e, target.id);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-orange-400 font-medium text-sm transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>Xóa bản Offline</span>
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    const target = actionModalState.track;
                    setActionModalState({ isOpen: false, track: null });
                    if (target) handleDownload(e, target);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Tải về nghe Offline</span>
                </button>
              )
            )}

            {/* Move to Album */}
            <button
              onClick={(e) => {
                const target = actionModalState.track;
                setActionModalState({ isOpen: false, track: null });
                if (target) handleMoveClick(e, target);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all cursor-pointer"
            >
              <FolderInput className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Di chuyển sang Album</span>
            </button>

            {/* Add to Playlist */}
            <button
              onClick={(e) => {
                const target = actionModalState.track;
                setActionModalState({ isOpen: false, track: null });
                if (target) handleAddToPlaylist(e, target.title, target.id);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Thêm vào Playlist / Album</span>
            </button>

            {/* Delete Track */}
            <button
              onClick={(e) => {
                const target = actionModalState.track;
                setActionModalState({ isOpen: false, track: null });
                if (target) handleDeleteClick(e, target);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium text-sm transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
              <span>Xóa bài hát</span>
            </button>
          </div>
        </div>
      )}

      <AddToPlaylistDialog 
        isOpen={dialogState.isOpen}
        songTitle={dialogState.songTitle}
        songId={dialogState.songId}
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
