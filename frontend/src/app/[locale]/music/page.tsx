'use client';

import React, { useState, useEffect } from 'react';
import { Downloader } from '@/components/molecules/Downloader/Downloader';
import { Cloud, Youtube, FileAudio, ArrowDownToLine } from 'lucide-react';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { DrivePicker } from '@/components/google-drive/DrivePicker';
import { fetchAlbums } from '@/lib/api';

export default function MusicPage() {
  const [albums, setAlbums] = useState<any[]>([]);
  const { login, listFiles, accessToken, files, isLoading: isDriveLoading } = useGoogleDrive();
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);

  useEffect(() => {
    fetchAlbums().then(setAlbums).catch(console.error);
  }, []);

  useEffect(() => {
    if (accessToken) {
      listFiles(accessToken);
      setIsDrivePickerOpen(true);
    }
  }, [accessToken, listFiles]);

  const handleConnectDrive = () => {
    if (!accessToken) {
      login();
    } else {
      listFiles(accessToken);
      setIsDrivePickerOpen(true);
    }
  };

  return (
    <main className="px-6 py-8 pb-32 min-h-[100dvh] max-w-7xl mx-auto space-y-12">
      <h1 className="text-3xl font-serif italic tracking-tight mb-8">Thêm Nhạc</h1>

      {/* Section A: YouTube Converter */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <Youtube className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-medium">Từ YouTube</h2>
        </div>
        
        <div className="bg-muted/30 border-[0.5px] border-border p-4 rounded-2xl">
          <Downloader />
        </div>
        
        {/* Placeholder for recent history */}
        <div className="pt-2">
          <h3 className="text-[13px] text-muted-foreground font-medium mb-3">Gần đây</h3>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-card border-[0.5px] border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileAudio className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium truncate">Đang tải xuống...</p>
                    <p className="text-[11px] text-muted-foreground">0%</p>
                  </div>
                </div>
                <ArrowDownToLine className="w-4 h-4 text-muted-foreground shrink-0 animate-bounce" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="border-border border-[0.5px]" />

      {/* Section B: Google Drive Import */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Cloud className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-medium">Từ Google Drive</h2>
        </div>

        <div className="bg-muted/30 border-[0.5px] border-border p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
          <Cloud className="w-12 h-12 text-muted-foreground opacity-50" />
          <div>
            <p className="text-[15px] font-medium mb-1">Kết nối Google Drive</p>
            <p className="text-[13px] text-muted-foreground">Chọn và nhập trực tiếp file .mp3, .flac, .wav từ Drive của bạn.</p>
          </div>
          <button 
            onClick={handleConnectDrive}
            className="bg-foreground text-background font-medium text-[13px] px-5 py-2.5 rounded-lg mt-2 hover:opacity-90 transition-opacity"
          >
            Kết nối Drive
          </button>
        </div>
      </section>

      {/* Drive Picker Modal */}
      <DrivePicker 
        isOpen={isDrivePickerOpen}
        onClose={() => setIsDrivePickerOpen(false)}
        accessToken={accessToken}
        files={files}
        isLoading={isDriveLoading}
        albums={albums}
        onImportComplete={() => {
          // Success feedback could be added here
        }}
      />
    </main>
  );
}
