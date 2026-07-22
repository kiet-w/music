'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Check, Disc, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAlbumStore } from '@/store/useAlbumStore';
import { useAuthStore } from '@/store/useAuthStore';
import { createAlbum, moveTrackToAlbum, uploadImage } from '@/lib/api';
import { LoadingPopup } from '@/components/atoms/ui/loading-popup';
import { ImageUploader } from '@/components/atoms/ui/ImageUploader';
import { toast } from 'sonner';

interface AddToPlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  songTitle: string;
  songId?: string;
}

export default function AddToPlaylistDialog({
  isOpen,
  onClose,
  songTitle,
  songId,
}: AddToPlaylistDialogProps) {
  const { albums, setAlbums, loadAlbums } = useAlbumStore();
  const { accessToken } = useAuthStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);

  const getEffectiveToken = () => {
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
  };

  useEffect(() => {
    if (isOpen) {
      const token = getEffectiveToken();
      if (token) loadAlbums(token);
    }
  }, [isOpen, loadAlbums]);

  if (!isOpen) return null;

  const handleSelectAlbum = async (albumId: string) => {
    setSelectedId(albumId);
    const token = getEffectiveToken();
    if (!token || !songId) {
      toast.error('Không tìm thấy ID bài hát hoặc phiên làm việc');
      return;
    }

    setIsSubmitting(true);
    try {
      await moveTrackToAlbum(token, songId, albumId);
      toast.success(`Đã thêm "${songTitle}" vào album!`);
      loadAlbums(token);
      onClose();
    } catch (err: any) {
      console.error('Failed to move track to album:', err);
      toast.error(err?.message || 'Không thể thêm bài hát vào album');
    } finally {
      setIsSubmitting(false);
      setSelectedId(null);
    }
  };

  const handleCreateNewAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getEffectiveToken();

    if (!newAlbumTitle.trim() || !token) {
      toast.error('Vui lòng nhập tên album và kiểm tra đăng nhập');
      return;
    }

    setIsCreatingAlbum(true);
    try {
      let uploadedCoverUrl: string | undefined = undefined;
      if (coverFile) {
        const uploadRes = await uploadImage(token, coverFile, 'covers');
        uploadedCoverUrl = uploadRes.url;
      }

      // Create album with title and optional coverUrl
      const newAlbum = await createAlbum(token, { 
        title: newAlbumTitle.trim(),
        coverUrl: uploadedCoverUrl 
      });
      
      // Update global album store immediately for the Albums page
      const currentAlbums = Array.isArray(albums) ? albums : [];
      setAlbums([newAlbum, ...currentAlbums]);
      
      toast.success(`Đã tạo album "${newAlbum.title}" thành công!`);

      // If songId is present, automatically associate the song with the new album
      if (songId) {
        await moveTrackToAlbum(token, songId, newAlbum.id);
        toast.success(`Đã thêm "${songTitle}" vào album mới!`);
      }

      setNewAlbumTitle('');
      setCoverFile(null);
      setCoverPreview(null);
      setShowCreateForm(false);
      onClose();
    } catch (err: any) {
      console.error('Failed to create album:', err);
      toast.error(err?.message || 'Không thể tạo album mới');
    } finally {
      setIsCreatingAlbum(false);
    }
  };

  return (
    <>
      <LoadingPopup
        isOpen={isSubmitting || isCreatingAlbum}
        text={isCreatingAlbum ? "Đang tạo album mới..." : "Đang thêm bài hát vào album..."}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
        />

        {/* Dialog Card */}
        <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-200 z-10 max-h-[85vh] flex flex-col">
          <div className="glass-dark rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col gap-4 overflow-hidden">
            <div className="flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white">Thêm vào Album / Playlist</h2>
                <p className="text-xs text-white/50 mt-1 truncate max-w-xs">
                  Chọn album cho bài hát "{songTitle}"
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Album Selection List */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-52 pr-1 scrollbar-hide shrink-0">
              {albums && albums.length > 0 ? (
                albums.map((album) => (
                  <button
                    key={album.id}
                    disabled={isSubmitting}
                    onClick={() => handleSelectAlbum(album.id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 text-left cursor-pointer",
                      selectedId === album.id
                        ? "bg-emerald-500/10 border-emerald-500/50 text-white"
                        : "bg-white/5 border-white/10 hover:bg-white/10 text-white/80 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/70 overflow-hidden shrink-0 border border-white/10">
                        {album.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
                        ) : (
                          <Disc className="w-5 h-5" />
                        )}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-semibold truncate">{album.title}</p>
                        <p className="text-[11px] text-white/40">{album._count?.songs || 0} bài hát</p>
                      </div>
                    </div>
                    {selectedId === album.id && <Check className="w-5 h-5 text-emerald-400 shrink-0" />}
                  </button>
                ))
              ) : (
                <div className="text-xs text-white/40 p-4 text-center italic">
                  Chưa có album nào. Bạn có thể tạo album mới bên dưới.
                </div>
              )}
            </div>

            {/* Inline Create New Album Form */}
            {showCreateForm ? (
              <form onSubmit={handleCreateNewAlbum} className="flex flex-col gap-3 pt-3 border-t border-white/10 overflow-y-auto max-h-72 scrollbar-hide">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-white/70">Tên Album mới:</label>
                  <input
                    type="text"
                    placeholder="Nhập tên album..."
                    value={newAlbumTitle}
                    onChange={(e) => setNewAlbumTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 rounded-xl border border-white/15 text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 text-sm font-medium"
                    required
                    autoFocus
                  />
                </div>

                <ImageUploader
                  label="Ảnh bìa Album (Tỉ lệ chuẩn 1:1):"
                  placeholder="Nhấp để tải ảnh bìa album..."
                  value={coverPreview}
                  onChange={(file, previewUrl) => {
                    setCoverFile(file);
                    setCoverPreview(previewUrl);
                  }}
                  onClear={() => {
                    setCoverFile(null);
                    setCoverPreview(null);
                  }}
                  aspectRatio="square"
                />

                <div className="flex justify-end gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingAlbum || !newAlbumTitle.trim()}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isCreatingAlbum && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Tạo & Thêm
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full py-3 rounded-2xl border border-dashed border-white/20 text-white/60 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer shrink-0 mt-1"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Tạo Album mới với ảnh bìa</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
