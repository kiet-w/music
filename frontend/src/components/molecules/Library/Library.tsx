'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Play, Plus, Trash2, FolderInput, Download, Loader2, X, MoreVertical, Share2 } from 'lucide-react';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fetchTracks, deleteTrack, moveTrackToAlbum } from '@/lib/api';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/store/useAuthStore';
import { useAlbumStore } from '@/store/useAlbumStore';
import { toast } from 'sonner';
import { ShareTrackModal } from '@/components/features/shared/ShareTrackModal';

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

const TrackDuration = React.memo(({ initialDuration, formatDuration }: { trackUrl: string; initialDuration: number | null; formatDuration: (seconds: number | null) => string }) => {
  return <>{formatDuration(initialDuration)}</>;
});

TrackDuration.displayName = 'TrackDuration';

export default function Library({ onTrackSelect, currentTrackId, albumId }: LibraryProps) {
  const t = useTranslations('Music');
  const { accessToken, isHydrated } = useAuthStore();
  const { albums } = useAlbumStore();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [offlineTracks, setOfflineTracks] = useState<Set<string>>(new Set());
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  // Dialog & Modal State
  const [dialogState, setDialogState] = useState<{ isOpen: boolean; songTitle: string; songId: string }>({
    isOpen: false,
    songTitle: '',
    songId: '',
  });

  const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; track: Track | null }>({
    isOpen: false,
    track: null,
  });

  const [moveModalState, setMoveModalState] = useState<{ isOpen: boolean; track: Track | null }>({
    isOpen: false,
    track: null,
  });

  const [actionModalState, setActionModalState] = useState<{ isOpen: boolean; track: Track | null }>({
    isOpen: false,
    track: null,
  });

  const [shareTrackState, setShareTrackState] = useState<{ isOpen: boolean; track: Track | null }>({
    isOpen: false,
    track: null,
  });

  const {
    saveTrackOffline,
    getOfflineTrack,
    getAllOfflineTrackIds,
    deleteOfflineTrack,
    isSupported,
  } = useOfflineStorage();

  const formatDuration = useCallback((seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, []);

  const loadTracks = useCallback(async () => {
    try {
      setLoading(true);
      const token = accessToken || '';
      const data = await fetchTracks(token);
      setTracks(data);
    } catch (err) {
      console.error('Failed to load tracks:', err);
      toast.error(t('error_loading_tracks') || 'Failed to load tracks');
    } finally {
      setLoading(false);
    }
  }, [accessToken, t]);

  const loadOfflineStatus = useCallback(async () => {
    if (!isSupported) return;
    try {
      const ids = await getAllOfflineTrackIds();
      setOfflineTracks(new Set(ids));
    } catch (err) {
      console.error('Failed to load offline tracks:', err);
    }
  }, [getAllOfflineTrackIds, isSupported]);

  useEffect(() => {
    if (isHydrated) {
      loadTracks();
      loadOfflineStatus();
    }
  }, [isHydrated, loadTracks, loadOfflineStatus]);

  const handleDownload = async (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    if (!isSupported) {
      toast.error('Browser does not support offline storage');
      return;
    }

    setDownloadingIds((prev) => new Set(prev).add(track.id));
    try {
      await saveTrackOffline(track.id, track.title, track.artist, track.url);
      setOfflineTracks((prev) => new Set(prev).add(track.id));
      toast.success(t('offline_save_success') || 'Track saved offline');
    } catch (err) {
      console.error('Failed to save offline:', err);
      toast.error(t('offline_save_error') || 'Failed to save track offline');
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(track.id);
        return next;
      });
    }
  };

  const handleRemoveOffline = async (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    try {
      await deleteOfflineTrack(trackId);
      setOfflineTracks((prev) => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });
      toast.success('Removed offline track');
    } catch (err) {
      console.error('Failed to remove offline track:', err);
      toast.error('Failed to remove offline track');
    }
  };

  const handleSelectTrack = async (track: Track) => {
    if (offlineTracks.has(track.id)) {
      try {
        const offlineData = await getOfflineTrack(track.id);
        if (offlineData) {
          const localUrl = URL.createObjectURL(offlineData.audioBlob);
          onTrackSelect(track, localUrl);
          return;
        }
      } catch (err) {
        console.error('Failed to load offline track, falling back to URL:', err);
      }
    }
    onTrackSelect(track);
  };

  const handleAddToPlaylist = (e: React.MouseEvent, songTitle: string, songId: string) => {
    e.stopPropagation();
    setDialogState({
      isOpen: true,
      songTitle,
      songId,
    });
  };

  const handleDeleteClick = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    setDeleteModalState({
      isOpen: true,
      track,
    });
  };

  const confirmDelete = async () => {
    if (!deleteModalState.track) return;
    const trackId = deleteModalState.track.id;
    try {
      const token = accessToken || '';
      await deleteTrack(token, trackId);
      if (offlineTracks.has(trackId)) {
        await deleteOfflineTrack(trackId);
        setOfflineTracks((prev) => {
          const next = new Set(prev);
          next.delete(trackId);
          return next;
        });
      }
      setTracks((prev) => prev.filter((t) => t.id !== trackId));
      toast.success(t('delete_success') || 'Track deleted successfully');
    } catch (err) {
      console.error('Failed to delete track:', err);
      toast.error(t('delete_error') || 'Failed to delete track');
    } finally {
      setDeleteModalState({ isOpen: false, track: null });
    }
  };

  const handleMoveClick = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    setMoveModalState({
      isOpen: true,
      track,
    });
  };

  const confirmMoveToAlbum = async (targetAlbumId: string | null) => {
    if (!moveModalState.track) return;
    const trackId = moveModalState.track.id;
    try {
      const token = accessToken || '';
      await moveTrackToAlbum(token, trackId, targetAlbumId);
      setTracks((prev) =>
        prev.map((t) => (t.id === trackId ? { ...t, albumId: targetAlbumId || undefined } : t))
      );
      toast.success(t('move_success') || 'Track moved successfully');
    } catch (err) {
      console.error('Failed to move track:', err);
      toast.error(t('move_error') || 'Failed to move track');
    } finally {
      setMoveModalState({ isOpen: false, track: null });
    }
  };

  const filteredTracks = albumId
    ? tracks.filter((t) => t.albumId === albumId)
    : tracks;

  const safeTracks = filteredTracks;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Track List */}
      <div className="space-y-1">
        {safeTracks.map((track) => {
          const isCurrent = track.id === currentTrackId;

          return (
            <div
              key={track.id}
              onClick={() => handleSelectTrack(track)}
              className={cn(
                'group flex items-center justify-between p-3 rounded-2xl transition-all duration-200 cursor-pointer border select-none',
                isCurrent
                  ? 'bg-white text-black border-white font-bold shadow-lg'
                  : 'bg-zinc-900/40 hover:bg-zinc-900 text-white border-white/5 hover:border-white/20'
              )}
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {/* Visualizer / Play Icon */}
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white/10">
                  {isCurrent ? (
                    <PlayingVisualizer />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </div>

                {/* Track Details */}
                <div className="min-w-0 flex-1">
                  <h4 className={cn('text-sm font-bold truncate leading-tight', isCurrent ? 'text-black' : 'text-white')}>
                    {track.title}
                  </h4>
                  <p className={cn('text-xs truncate mt-0.5 font-medium', isCurrent ? 'text-zinc-600' : 'text-zinc-400')}>
                    {track.artist || 'Nghệ sĩ'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn('text-xs font-mono hidden sm:inline-block mr-1', isCurrent ? 'text-zinc-600' : 'text-zinc-400')}>
                  <TrackDuration trackUrl={track.url} initialDuration={track.duration} formatDuration={formatDuration} />
                </span>

                {/* Action Trigger Button (...) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActionModalState({ isOpen: true, track });
                  }}
                  className={cn(
                    'p-2 rounded-xl transition-all cursor-pointer',
                    isCurrent
                      ? 'text-black hover:bg-zinc-200'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  )}
                  title="Tùy chọn khác"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        {safeTracks.length === 0 && (
          <div className="p-12 text-center text-zinc-500 font-medium text-sm">
            Chưa có bài hát nào trong danh sách.
          </div>
        )}
      </div>

      {/* Track Options Action Popup Modal — Light Transparent Overlay, Non-Blocking */}
      {actionModalState.isOpen && actionModalState.track && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          <div
            onClick={() => setActionModalState({ isOpen: false, track: null })}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />
          <div className="relative w-80 bg-zinc-950/95 rounded-[2rem] p-3.5 shadow-2xl border border-white/15 animate-in zoom-in-95 duration-150 z-10 flex flex-col gap-2">
            {/* Header */}
            <div className="px-3 py-2 border-b border-white/10 mb-1 flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-xs font-bold truncate text-white">{actionModalState.track.title}</p>
                <p className="text-[10px] text-zinc-400 truncate">{actionModalState.track.artist || 'Nghệ sĩ'}</p>
              </div>
              <button
                type="button"
                onClick={() => setActionModalState({ isOpen: false, track: null })}
                className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X size={12} />
              </button>
            </div>

            {/* Send to Friend */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const target = actionModalState.track;
                setActionModalState({ isOpen: false, track: null });
                if (target) setShareTrackState({ isOpen: true, track: target });
              }}
              className="w-full flex items-center gap-3 h-11 px-4 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-white font-medium text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
            >
              <Share2 className="w-4 h-4 text-white shrink-0" />
              <span>Gửi nhạc cho bạn bè</span>
            </button>

            {/* Download / Remove Offline */}
            {isSupported !== false && (
              offlineTracks.has(actionModalState.track.id) ? (
                <button
                  onClick={(e) => {
                    const target = actionModalState.track;
                    setActionModalState({ isOpen: false, track: null });
                    if (target) handleRemoveOffline(e, target.id);
                  }}
                  className="w-full flex items-center gap-3 h-11 px-4 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-orange-400 font-medium text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
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
                  className="w-full flex items-center gap-3 h-11 px-4 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-white font-medium text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4 text-white shrink-0" />
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
              className="w-full flex items-center gap-3 h-11 px-4 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-white font-medium text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
            >
              <FolderInput className="w-4 h-4 text-white shrink-0" />
              <span>Di chuyển sang Album</span>
            </button>

            {/* Add to Playlist */}
            <button
              onClick={(e) => {
                const target = actionModalState.track;
                setActionModalState({ isOpen: false, track: null });
                if (target) handleAddToPlaylist(e, target.title, target.id);
              }}
              className="w-full flex items-center gap-3 h-11 px-4 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-white font-medium text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-white shrink-0" />
              <span>Thêm vào Playlist / Album</span>
            </button>

            {/* Delete Track */}
            <button
              onClick={(e) => {
                const target = actionModalState.track;
                setActionModalState({ isOpen: false, track: null });
                if (target) handleDeleteClick(e, target);
              }}
              className="w-full flex items-center gap-3 h-11 px-4 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border border-rose-900/40 font-medium text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
            >
              <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Xóa bài hát</span>
            </button>
          </div>
        </div>
      )}

      {/* Global Share Track Modal */}
      <ShareTrackModal
        track={shareTrackState.track}
        isOpen={shareTrackState.isOpen}
        onClose={() => setShareTrackState({ isOpen: false, track: null })}
      />

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
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />
          <div className="relative w-full max-w-sm bg-zinc-950 rounded-3xl p-6 shadow-2xl border border-white/10 z-10 flex flex-col gap-4">
            <h3 className="text-base font-bold text-white">Xác nhận xóa bài hát</h3>
            <p className="text-xs text-zinc-400">
              Bạn có chắc chắn muốn xóa bài hát <strong className="text-white">"{deleteModalState.track.title}"</strong> khỏi hệ thống?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteModalState({ isOpen: false, track: null })}
                className="border-white/10 text-white hover:bg-white/10 rounded-xl text-xs"
              >
                Hủy
              </Button>
              <Button
                onClick={confirmDelete}
                className="bg-white text-black font-bold rounded-xl text-xs hover:bg-zinc-200"
              >
                Xóa ngay
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Move to Album Modal */}
      {moveModalState.isOpen && moveModalState.track && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div
            onClick={() => setMoveModalState({ isOpen: false, track: null })}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />
          <div className="relative w-full max-w-sm bg-zinc-950 rounded-3xl p-6 shadow-2xl border border-white/10 z-10 flex flex-col gap-4">
            <h3 className="text-base font-bold text-white">Di chuyển bài hát sang Album</h3>
            <p className="text-xs text-zinc-400 truncate">
              Chọn album bạn muốn chuyển bài <strong className="text-white">"{moveModalState.track.title}"</strong> vào:
            </p>

            <div className="max-h-48 overflow-y-auto space-y-1 my-2 pr-1 custom-scrollbar">
              <button
                onClick={() => confirmMoveToAlbum(null)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border",
                  !moveModalState.track.albumId
                    ? "bg-white text-black border-white font-bold"
                    : "bg-zinc-900 text-zinc-300 border-white/5 hover:bg-zinc-800 hover:text-white"
                )}
              >
                Không thuộc album nào (Thư viện chính)
              </button>

              {albums.map((alb) => {
                const isSelected = moveModalState.track?.albumId === alb.id;
                return (
                  <button
                    key={alb.id}
                    onClick={() => confirmMoveToAlbum(alb.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border truncate",
                      isSelected
                        ? "bg-white text-black border-white font-bold"
                        : "bg-zinc-900 text-zinc-300 border-white/5 hover:bg-zinc-800 hover:text-white"
                    )}
                  >
                    {alb.title}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setMoveModalState({ isOpen: false, track: null })}
                className="border-white/10 text-white hover:bg-white/10 rounded-xl text-xs"
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
