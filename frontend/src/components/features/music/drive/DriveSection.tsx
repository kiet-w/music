'use client';

// ponytail: google drive import section component with monochromatic black & white styling
import React, { useState, useEffect } from 'react';
import { HardDrive, Search, Loader2, Disc } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { useAuthStore } from '@/store/useAuthStore';
import { useAlbumStore } from '@/store/useAlbumStore';
import { CustomSelect, SelectOption } from '@/components/ui/custom-select';
import { toast } from 'sonner';

export interface Album {
  id: string;
  title: string;
  artist?: string;
}

export interface DriveSectionProps {
  onBrowseClick?: () => void;
  isCheckingConnection?: boolean;
  isDriveLoading?: boolean;
  selectedAlbumId?: string;
  setSelectedAlbumId?: (id: string) => void;
  albums?: Album[];
  t?: (key: string) => string;
  onSuccess?: () => void;
}

export function DriveSection({
  onBrowseClick,
  isCheckingConnection = false,
  isDriveLoading = false,
  selectedAlbumId: propAlbumId,
  setSelectedAlbumId: propSetAlbumId,
  albums: propAlbums,
  t,
  onSuccess,
}: DriveSectionProps) {
  const { accessToken } = useAuthStore();
  const { openPicker, login, isLoading: hookDriveLoading } = useGoogleDrive();
  const { albums: storeAlbums, loadAlbums } = useAlbumStore();

  const [internalAlbumId, setInternalAlbumId] = useState<string>('');

  const currentAlbumId = propAlbumId !== undefined ? propAlbumId : internalAlbumId;
  const setAlbumId = propSetAlbumId || setInternalAlbumId;

  const currentAlbums = propAlbums || (Array.isArray(storeAlbums) ? storeAlbums : []);
  const isLoading = isDriveLoading || hookDriveLoading;

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

  const handleBrowse = async () => {
    if (onBrowseClick) {
      onBrowseClick();
      return;
    }

    const token = getEffectiveToken();
    if (!token) {
      toast.error('Vui lòng đăng nhập để truy cập Google Drive');
      return;
    }

    try {
      await openPicker(token, currentAlbumId || undefined);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      if (err?.message === 'Google API not loaded' || err?.error === 'idpiframe_initialization_failed') {
        toast.info('Đang chuyển sang đăng nhập Google Drive...');
        await login(token);
      } else {
        console.error('Drive import error:', err);
      }
    }
  };

  const albumOptions: SelectOption[] = [
    {
      value: '',
      label: t ? t('no_album_single') : 'Không chọn album (Single)',
      description: 'Lưu bài hát dưới dạng Single độc lập',
    },
    ...currentAlbums.map((album) => ({
      value: album.id,
      label: album.title,
      description: album.artist ? `Nghệ sĩ: ${album.artist}` : 'Album nhạc',
    })),
  ];

  return (
    <motion.section
      key="drive"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="space-y-4"
    >
      <div className="bg-zinc-950/40 border border-white/10 p-5 rounded-2xl flex flex-col items-center text-center gap-4 relative overflow-hidden text-white">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white shadow-inner">
          <HardDrive className="w-7 h-7 text-white" />
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white tracking-tight">
            {t ? t('drive_title') : 'Google Drive MP3 Import'}
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans max-w-[280px]">
            {t ? t('drive_description') : 'Tải file MP3 trực tiếp từ tài khoản Google Drive cá nhân vào danh sách phát.'}
          </p>
        </div>

        {/* Album Selector */}
        <div className="w-full text-left space-y-1.5 pt-2 border-t border-white/10">
          <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
            <Disc className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t ? t('default_album') : 'Chọn Album đích cho file MP3'}</span>
          </label>
          <CustomSelect
            value={currentAlbumId}
            onChange={(val) => setAlbumId(val)}
            options={albumOptions}
            disabled={isLoading}
            onOpen={() => {
              const token = getEffectiveToken();
              if (token) loadAlbums(token);
            }}
            placeholder={t ? t('no_album_single') : 'Không chọn album (Single)'}
          />
        </div>

        {/* Browse Button */}
        <button
          type="button"
          onClick={handleBrowse}
          disabled={isCheckingConnection || isLoading}
          className="w-full h-11 mt-1 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs tracking-wide transition-all shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          {isCheckingConnection || isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
              <span>Đang kết nối Google Drive...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4 text-zinc-950" />
              <span>{t ? t('browse_drive') : 'Mở Google Drive'}</span>
            </>
          )}
        </button>
      </div>
    </motion.section>
  );
}

export default DriveSection;
