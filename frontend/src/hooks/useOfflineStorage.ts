'use client';

import { useState, useCallback } from 'react';

export function useOfflineStorage() {
  const [offlineTracks] = useState<Set<string>>(new Set());
  const isSupported = false;

  const downloadTrack = useCallback(async (_trackId: string, _url: string) => {
    return false;
  }, []);

  const removeTrack = useCallback(async (_trackId: string) => {
    return false;
  }, []);

  const getLocalUri = useCallback(async (_trackId: string): Promise<string | null> => {
    return null;
  }, []);

  const saveTrackOffline = useCallback(async (_id: string, _title: string, _artist: string | null, _url: string): Promise<boolean> => {
    return false;
  }, []);

  const getOfflineTrack = useCallback(async (_id: string): Promise<{ audioBlob: Blob } | null> => {
    return null;
  }, []);

  const getAllOfflineTrackIds = useCallback(async (): Promise<string[]> => {
    return [];
  }, []);

  const deleteOfflineTrack = useCallback(async (_id: string): Promise<boolean> => {
    return false;
  }, []);

  return {
    offlineTracks,
    downloadTrack,
    removeTrack,
    getLocalUri,
    saveTrackOffline,
    getOfflineTrack,
    getAllOfflineTrackIds,
    deleteOfflineTrack,
    isSupported,
  };
}