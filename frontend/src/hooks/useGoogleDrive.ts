'use client';

import { useState, useCallback } from 'react';
import { fetchGoogleDriveFiles, fetchGoogleDriveAuthUrl, fetchGoogleDriveStatus, importMusic } from '@/lib/api';
import { toast } from 'sonner';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
}

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

// KHÁC BIỆT Ở ĐÂY: Tạo 1 biến cache nằm NGOÀI hàm để lưu trạng thái tải toàn cục
let googleScriptsPromise: Promise<void> | null = null;

const loadGoogleScripts = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();

  // 1. Nếu cửa sổ Google đã sẵn sàng từ trước, trả về resolve luôn
  if (!!window.gapi && !!window.google) {
    return Promise.resolve();
  }

  // 2. Nếu đang có một tiến trình tải đang chạy dở dang, dùng lại đúng tiến trình đó
  // Điều này giúp chặn đứng việc add trùng listener hay tạo trùng thẻ script khi user bấm liên tục!
  if (googleScriptsPromise) {
    return googleScriptsPromise;
  }

  // 3. Nếu chưa tải và chưa có tiến trình nào, tiến hành tạo mới
  googleScriptsPromise = new Promise((resolve, reject) => {
    const loadScript = (src: string) => {
      return new Promise<void>((resolveScript, rejectScript) => {
        // Lúc này không sợ bị trùng nữa vì biến googleScriptsPromise phía trên đã chặn rồi
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.defer = true;
        script.onload = () => resolveScript();
        script.onerror = () => rejectScript(new Error(`Failed to load ${src}`));
        document.body.appendChild(script);
      });
    };

    const isGapiLoaded = !!window.gapi;
    const isGoogleLoaded = !!window.google;

    Promise.all([
      isGapiLoaded ? Promise.resolve() : loadScript('https://apis.google.com/js/api.js'),
      isGoogleLoaded ? Promise.resolve() : loadScript('https://accounts.google.com/gsi/client'),
    ])
      .then(() => resolve())
      .catch((err) => {
        googleScriptsPromise = null; // Nếu bị lỗi mạng không tải được, reset lại để lần sau user bấm nút thì tải lại
        reject(err);
      });
  });

  return googleScriptsPromise;
};

export function useGoogleDrive() {
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const checkConnection = useCallback(async (appToken: string) => {
    try {
      const data = await fetchGoogleDriveStatus(appToken);
      const connected = data.linked;
      setIsConnected(connected);
      return connected;
    } catch (err) {
      setIsConnected(false);
      return false;
    }
  }, []);

  const openPicker = useCallback(async (appToken: string, albumId?: string) => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        await loadGoogleScripts();
      } catch (err) {
        toast.error('Failed to load Google API scripts');
        return reject(err);
      }

      const gapi = window.gapi;
      const google = window.google;

      if (!gapi || !google) {
        toast.error('Google API not loaded yet');
        return reject(new Error('Google API not loaded'));
      }

      const loadPicker = () => {
        gapi.load('picker', {
          callback: () => {
            const tokenClient = google.accounts.oauth2.initTokenClient({
              client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
              scope: 'https://www.googleapis.com/auth/drive.readonly',
              callback: async (response: any) => {
                if (response.error !== undefined) {
                  return reject(response);
                }
                const accessToken = response.access_token;
                createPicker(accessToken);
              },
            });

            tokenClient.requestAccessToken({ prompt: '' });
          }
        });
      };

      const createPicker = (accessToken: string) => {
        const view = new google.picker.DocsView(google.picker.ViewId.DOCS);
        view.setMimeTypes('audio/mpeg');

        const picker = new google.picker.PickerBuilder()
          .addView(view)
          .setOAuthToken(accessToken)
          .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '')
          .setCallback(async (data: any) => {
            if (data.action === google.picker.Action.PICKED) {
              const file = data.docs[0];
              try {
                await importMusic(appToken, file.id, file.name, accessToken, albumId);
                if (window.google?.accounts?.oauth2?.revoke) {
                  window.google.accounts.oauth2.revoke(accessToken, () => {
                    console.log('Google access token revoked successfully after import.');
                  });
                }
                resolve();
              } catch (err) {
                console.error('Import failed:', err);
                if (window.google?.accounts?.oauth2?.revoke) {
                  window.google.accounts.oauth2.revoke(accessToken, () => {});
                }
                reject(err);
              }
            } else if (data.action === google.picker.Action.CANCEL) {
              if (window.google?.accounts?.oauth2?.revoke) {
                window.google.accounts.oauth2.revoke(accessToken, () => {});
              }
              resolve();
            }
          })
          .build();
        picker.setVisible(true);
      };

      loadPicker();
    });
  }, []);

  const login = useCallback(async (appToken: string) => {
    console.log('Login function called');
    setIsLoading(true);
    setError(null);
    try {
      // Save current locale to localStorage so the bridge page can redirect back correctly
      if (typeof window !== 'undefined') {
        const locale = window.location.pathname.split('/')[1];
        if (locale) localStorage.setItem('NEXT_LOCALE', locale);
      }

      const { url } = await fetchGoogleDriveAuthUrl(appToken);
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No auth URL returned from backend');
      }
    } catch (err: any) {
      console.error('Error fetching auth URL:', err);
      setError(err.message || 'Failed to get auth URL');
      toast.error('Lỗi khởi tạo Google Drive: ' + err.message, { id: 'drive-auth-error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const listFiles = useCallback(async (appToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data: any = await fetchGoogleDriveFiles(appToken);
      
      // If backend returns an error object (common in some API patterns)
      if (data && !Array.isArray(data) && (data.error || data.message === 'Google Drive not connected')) {
        setIsConnected(false);
        setFiles([]);
        return;
      }

      setFiles(Array.isArray(data) ? data : []);
      setIsConnected(true);
    } catch (err: any) {
      console.error('Error listing files:', err);
      // If we get a 401/403 specifically related to Google, we might want to set isConnected to false
      if (err.status === 401 || err.status === 403) {
        setIsConnected(false);
      }
      setError(err.message || 'Failed to list files');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    login,
    listFiles,
    checkConnection,
    openPicker,
    isConnected,
    files,
    isLoading,
    error,
  };
}
