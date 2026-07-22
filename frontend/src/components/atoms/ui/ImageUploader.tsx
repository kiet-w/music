'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  value?: string | null;
  onChange: (file: File | null, previewUrl: string | null) => void;
  onClear?: () => void;
  label?: string;
  placeholder?: string;
  isUploading?: boolean;
  aspectRatio?: 'square' | 'wide';
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  onClear,
  label = 'Ảnh bìa / Avatar',
  placeholder = 'Nhấp hoặc kéo thả ảnh vào đây (JPEG, PNG, WEBP, tối đa 5MB)',
  isUploading = false,
  aspectRatio = 'square',
  className,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const displayUrl = localPreview || value;

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp định dạng hình ảnh (JPEG, PNG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh vượt quá giới hạn 5MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);
    onChange(file, previewUrl);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onChange(null, null);
    if (onClear) onClear();
  };

  return (
    <div className={cn('flex flex-col gap-2 w-full', className)}>
      {label && <label className="text-xs font-semibold text-white/70">{label}</label>}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'relative overflow-hidden rounded-2xl border border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group',
          aspectRatio === 'square' ? 'aspect-square max-h-48' : 'h-36',
          isDragOver
            ? 'border-emerald-500 bg-emerald-500/10'
            : displayUrl
            ? 'border-white/20 bg-black/40'
            : 'border-white/15 bg-white/5 hover:border-emerald-500/50 hover:bg-white/10'
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Đang tải ảnh lên...</span>
          </div>
        ) : displayUrl ? (
          <div className="relative w-full h-full group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl}
              alt="Preview"
              className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-2xl">
              <span className="text-xs font-bold text-white bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md">
                Thay đổi ảnh
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors"
                title="Xóa ảnh"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:border-emerald-500/40 transition-all">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-xs text-white/60 font-medium max-w-[200px] leading-relaxed">
              {placeholder}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageUploader;
