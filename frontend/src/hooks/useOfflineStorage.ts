'use client';

import { useState, useEffect, useCallback } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export function useOfflineStorage() {
  const [offlineTracks, setOfflineTracks] = useState<Set<string>>(new Set());

  // Load initial state
  useEffect(() => {
    const checkExistingFiles = async () => {
      try {
        const result = await Filesystem.readdir({
          path: 'offline_music',
          directory: Directory.Data,
        }).catch(() => null); // Ignore if dir doesn't exist yet

        if (result) {
          const ids = result.files.map(f => f.name.replace('.mp3', ''));
          setOfflineTracks(new Set(ids));
        }
      } catch (error) {
        console.error('Failed to read offline directory', error);
      }
    };
    checkExistingFiles();
  }, []);

  const downloadTrack = useCallback(async (trackId: string, url: string) => {
    try {
      // Ensure directory exists
      await Filesystem.mkdir({
        path: 'offline_music',
        directory: Directory.Data,
        recursive: true
      }).catch(() => {});

      // Fetch the file as a Blob
      const response = await fetch(url);
      const blob = await response.blob();

      // Convert Blob to Base64
      const reader = new FileReader();
      const base64data = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Write to filesystem
      await Filesystem.writeFile({
        path: `offline_music/${trackId}.mp3`,
        data: base64data,
        directory: Directory.Data,
      });

      setOfflineTracks(prev => {
        const next = new Set(prev);
        next.add(trackId);
        return next;
      });
      return true;
    } catch (error) {
      console.error('Failed to download track', error);
      return false;
    }
  }, []);

  const removeTrack = useCallback(async (trackId: string) => {
    try {
      await Filesystem.deleteFile({
        path: `offline_music/${trackId}.mp3`,
        directory: Directory.Data,
      });
      setOfflineTracks(prev => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });
      return true;
    } catch (error) {
      console.error('Failed to remove track', error);
      return false;
    }
  }, []);

  const getLocalUri = useCallback(async (trackId: string): Promise<string | null> => {
    try {
      if (!offlineTracks.has(trackId)) return null;
      
      const filePath = `offline_music/${trackId}.mp3`;

      // Trên Web (trình duyệt), Capacitor convertFileSrc không hoạt động đúng cho audio.
      // Thay vào đó, chúng ta đọc file từ IndexedDB và chuyển thành data URI.
      if (Capacitor.getPlatform() === 'web') {
        const contents = await Filesystem.readFile({
          path: filePath,
          directory: Directory.Data,
        });
        
        // contents.data is already base64, just prefix it
        // Note: For large files on web, this might consume memory, but it's the only way to play offline on web.
        const base64Data = contents.data;
        const prefix = base64Data.toString().startsWith('data:audio') ? '' : 'data:audio/mp3;base64,';
        return `${prefix}${base64Data}`;
      }

      // Trên Native (Android/iOS), dùng convertFileSrc để lấy đường dẫn vật lý an toàn
      const result = await Filesystem.getUri({
        path: filePath,
        directory: Directory.Data,
      });
      return Capacitor.convertFileSrc(result.uri);
    } catch (error) {
      console.error('Lỗi khi lấy URI offline:', error);
      return null;
    }
  }, [offlineTracks]);

  return {
    offlineTracks,
    downloadTrack,
    removeTrack,
    getLocalUri,
  };
}