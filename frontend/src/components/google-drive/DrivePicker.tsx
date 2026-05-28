"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, File, Music, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { GoogleDriveFile } from "@/hooks/useGoogleDrive";
import { importFromDrive } from "@/lib/api";

interface DrivePickerProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  files: GoogleDriveFile[];
  isLoading: boolean;
  albumId?: string;
  albums?: any[];
  onImportComplete?: () => void;
}

export const DrivePicker = ({
  isOpen,
  onClose,
  accessToken,
  files,
  isLoading,
  albumId: initialAlbumId,
  albums = [],
  onImportComplete,
}: DrivePickerProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedAlbumId, setSelectedAlbumId] = useState(initialAlbumId);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);

  // Cập nhật selectedAlbumId khi initialAlbumId thay đổi
  useEffect(() => {
    if (initialAlbumId) setSelectedAlbumId(initialAlbumId);
    else if (albums.length > 0 && !selectedAlbumId) setSelectedAlbumId(albums[0].id);
  }, [initialAlbumId, albums]);

  const filteredFiles = useMemo(() => {
    // Đảm bảo files luôn là một mảng để tránh lỗi .filter is not a function
    const filesArray = Array.isArray(files) ? files : [];
    return filesArray.filter((file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [files, searchQuery]);

  const toggleFile = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleImport = async () => {
    if (!accessToken || selectedIds.size === 0 || !selectedAlbumId) {
      if (!selectedAlbumId) alert('Vui lòng chọn Album trước khi nhập nhạc.');
      return;
    }

    setIsImporting(true);
    const ids = Array.from(selectedIds);
    setImportProgress({ current: 0, total: ids.length });

    try {
      for (let i = 0; i < ids.length; i++) {
        setImportProgress({ current: i + 1, total: ids.length });
        await importFromDrive(ids[i], accessToken, selectedAlbumId);
      }
      onImportComplete?.();
      onClose();
    } catch (error) {
      console.error("Import failed:", error);
      alert("Một số file gặp lỗi khi nhập. Vui lòng thử lại.");
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl p-6 mx-4 h-[80vh] flex flex-col"
          >
            <div className="bg-[#1A1A1A] rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col h-full overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Google Drive</h2>
                  <p className="text-sm text-white/40 mt-1">Chọn nhạc để nhập vào thư viện</p>
                </div>
                <button 
                  onClick={onClose} 
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X className="w-6 h-6 text-white/60" />
                </button>
              </div>

              {/* Album Selection UI */}
              <div className="mb-6 space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/40 px-1">Nhập vào Album:</label>
                <select 
                  value={selectedAlbumId}
                  onChange={(e) => setSelectedAlbumId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all appearance-none cursor-pointer"
                >
                  {albums.map((album) => (
                    <option key={album.id} value={album.id} className="bg-[#1A1A1A]">
                      {album.title} {album.artist ? ` - ${album.artist}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="Tìm kiếm file..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full py-12">
                    <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
                    <p className="text-white/60">Fetching files from your Drive...</p>
                  </div>
                ) : (files as any)?.error ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 w-full">
                      <p className="text-red-400 font-medium mb-2">Lỗi từ Google Drive:</p>
                      <p className="text-white/60 text-sm">{(files as any).message || 'Không thể lấy danh sách file'}</p>
                      {(files as any).details?.error?.message && (
                        <p className="text-white/40 text-xs mt-4 italic">Chi tiết: {(files as any).details.error.message}</p>
                      )}
                    </div>
                  </div>
                ) : filteredFiles.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {filteredFiles.map((file) => {
                      const isSelected = selectedIds.has(file.id);
                      const isAudio = file.mimeType.startsWith('audio/') || 
                                     file.name.toLowerCase().endsWith('.mp3') || 
                                     file.name.toLowerCase().endsWith('.wav') ||
                                     file.name.toLowerCase().endsWith('.flac') ||
                                     file.name.toLowerCase().endsWith('.m4a');
                      
                      const fileSize = file.size ? `${(parseInt(file.size) / (1024 * 1024)).toFixed(1)} MB` : 'Unknown size';
                      
                      return (
                        <button
                          key={file.id}
                          onClick={() => toggleFile(file.id)}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left",
                            isSelected
                              ? "bg-accent/20 border-accent/50 text-accent"
                              : "bg-white/5 border-transparent hover:bg-white/10 text-white/80"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            isSelected ? "bg-accent/20" : "bg-white/10"
                          )}>
                            {isAudio ? <Music className="w-5 h-5" /> : <File className="w-5 h-5 opacity-40" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{file.name}</h3>
                            <p className="text-xs opacity-40 truncate">{file.mimeType} • {fileSize}</p>
                          </div>

                          {isSelected && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                              <Check className="w-5 h-5" />
                            </motion.div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <p className="text-white/40">No matching files found.</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                <p className="text-sm text-white/40 font-medium">
                  {selectedIds.size} file{selectedIds.size !== 1 && 's'} selected
                </p>
                <div className="flex gap-3">
                   <button
                    onClick={onClose}
                    className="px-6 py-3 rounded-xl font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={selectedIds.size === 0 || isImporting}
                    onClick={handleImport}
                    className={cn(
                      "px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2",
                      selectedIds.size > 0 && !isImporting
                        ? "bg-accent text-white shadow-lg shadow-accent/20 hover:scale-105 active:scale-95"
                        : "bg-white/5 text-white/20 cursor-not-allowed"
                    )}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Importing ({importProgress?.current}/{importProgress?.total})</span>
                      </>
                    ) : (
                      <>
                        <span>Import Selected</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
