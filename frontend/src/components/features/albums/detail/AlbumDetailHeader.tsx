'use client';

import React, { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Disc, Camera, Loader2, Sparkles } from 'lucide-react';
import { getMediaUrl } from '@/lib/utils';
import { uploadImage, updateAlbum } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useAlbumStore } from '@/store/useAlbumStore';
import { toast } from 'sonner';

interface Album {
  id: string;
  title: string;
  artist: string | null;
  coverUrl: string | null;
}

interface AlbumDetailHeaderProps {
  album: Album;
  isAlbumActive: boolean;
  onAlbumUpdated?: (updated: Album) => void;
}

export function AlbumDetailHeader({ album, isAlbumActive, onAlbumUpdated }: AlbumDetailHeaderProps) {
  const t = useTranslations('Music');
  const tAuth = useTranslations('Auth');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { accessToken } = useAuthStore();
  const { albums, setAlbums, loadAlbums } = useAlbumStore();

  const [isUploading, setIsUploading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [localCover, setLocalCover] = useState<string | null>(null);

  const mediaUrl = localCover || getMediaUrl(album.coverUrl);

  const getEffectiveToken = () => {
    if (accessToken) return accessToken;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('music.auth');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.accessToken || parsed.state?.accessToken || null;
        } catch {
          return null;
        }
      }
    }
    return null;
  };

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getEffectiveToken();
    if (!token) {
      toast.error(tAuth('session_expired') || 'Phiên đăng nhập hết hạn');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error(tAuth('invalid_file_type') || 'Vui lòng chọn tệp hình ảnh (JPEG, PNG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(tAuth('image_size_exceeded') || 'Kích thước ảnh không vượt quá 5MB');
      return;
    }

    // Instant local preview
    const previewUrl = URL.createObjectURL(file);
    setLocalCover(previewUrl);
    setHasError(false);
    setIsUploading(true);

    try {
      const { url } = await uploadImage(token, file, 'covers');
      await updateAlbum(token, album.id, { coverUrl: url });
      
      // Update local Zustand album store
      const updatedAlbums = albums.map(a => a.id === album.id ? { ...a, coverUrl: url } : a);
      setAlbums(updatedAlbums);
      await loadAlbums(token, true);

      if (onAlbumUpdated) {
        onAlbumUpdated({ ...album, coverUrl: url });
      }

      toast.success(t('update_cover_success') || 'Đã cập nhật ảnh bìa Album thành công!');
    } catch (err: any) {
      console.error('Failed to update album cover:', err);
      toast.error(err?.message || t('update_cover_error') || 'Không thể cập nhật ảnh bìa Album');
      setLocalCover(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-950/80 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] transition-all duration-500">
      {/* Studio Ambient Gradient Backdrop */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 bg-white/[0.03] rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 bg-zinc-800/20 rounded-full blur-3xl" />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleCoverSelect}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
        {/* Cover Art Frame with Diffusion Shadow & Hover Glow */}
        <div className="relative group shrink-0">
          {/* Ambient Diffused Glow behind the cover */}
          <div className="absolute inset-0 rounded-[2.5rem] bg-white/10 blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none" />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-[2.5rem] bg-zinc-900 flex items-center justify-center border border-white/15 overflow-hidden relative shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] cursor-pointer group hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 ease-out shrink-0 aspect-square"
            title="Nhấp để chọn / thay đổi ảnh bìa Album (Tỉ lệ chuẩn 1:1)"
          >
            {isUploading ? (
              <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
                <span className="text-xs font-semibold text-white/80">Đang tải...</span>
              </div>
            ) : mediaUrl && !hasError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl}
                alt={album.title}
                onError={() => setHasError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 p-4 text-center">
                <Disc className="w-14 h-14 text-white/30 group-hover:text-white/70 transition-colors duration-300 stroke-[1.2]" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/40 max-w-[120px] truncate">
                  {album.title}
                </span>
              </div>
            )}

            {/* Hover Glass Overlay for Edit Cover */}
            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 text-white">
              <div className="p-3 rounded-full bg-white/10 border border-white/20">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-bold tracking-wide">Đổi ảnh bìa</span>
            </div>

            {/* Playing Status Pill */}
            {isAlbumActive && !isUploading && (
              <div className="absolute top-3 right-3 bg-zinc-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-2 shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-extrabold tracking-wider uppercase text-white">
                  Đang phát
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Album Meta Info */}
        <div className="space-y-2 min-w-0 flex-1 text-center sm:text-left w-full">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-zinc-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md inline-flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-white/70" />
              Studio Album
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white truncate drop-shadow-md leading-tight">
            {album.title}
          </h1>

          <div className="flex items-center justify-center sm:justify-start gap-2 text-zinc-300 font-medium text-sm sm:text-base">
            <span className="text-zinc-400">Nghệ sĩ:</span>
            <span className="font-semibold text-white truncate">
              {album.artist || 'Nhiều nghệ sĩ'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
