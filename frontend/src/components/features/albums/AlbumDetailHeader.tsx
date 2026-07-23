'use client';

import React, { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Disc, Camera, Loader2 } from 'lucide-react';
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
      const updated = await updateAlbum(token, album.id, { coverUrl: url });
      
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
    <div className="flex items-center space-x-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleCoverSelect}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      <div 
        onClick={() => fileInputRef.current?.click()}
        className="w-32 h-32 sm:w-36 sm:h-36 bg-white/5 rounded-2xl flex items-center justify-center text-white text-xs text-center p-2 shadow-xl border border-white/10 overflow-hidden relative group cursor-pointer aspect-square shrink-0"
        title="Nhấp để chọn / thay đổi ảnh bìa Album (Tỉ lệ chuẩn 1:1)"
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2 p-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span className="text-[10px] font-medium text-emerald-400">Đang tải...</span>
          </div>
        ) : mediaUrl && !hasError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={mediaUrl} 
            alt={album.title} 
            onError={() => setHasError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <Disc className="w-12 h-12 text-white/20 group-hover:text-emerald-400/60 transition-colors" />
        )}

        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
          <Camera className="w-5 h-5 text-emerald-400" />
          <span className="text-[10px] font-bold">Đổi ảnh bìa</span>
        </div>

        {isAlbumActive && !isUploading && (
          <div className="absolute top-2 right-2 bg-emerald-500/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[9px] font-bold text-emerald-400">Playing</span>
          </div>
        )}
      </div>

      <div className="space-y-1 min-w-0 flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white truncate">
          {album.title}
        </h1>
        <p className="text-sm text-white/50 font-medium">
          {album.artist || 'Nhiều nghệ sĩ'}
        </p>
      </div>
    </div>
  );
}
