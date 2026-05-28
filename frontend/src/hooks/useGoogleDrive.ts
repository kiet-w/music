import { useState, useCallback } from 'react';
import { fetchGoogleDriveFiles } from '@/lib/api';

declare global {
  interface Window {
    google: any;
  }
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
}

export function useGoogleDrive() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(() => {
    console.log('Login function called');
    if (!window.google) {
      console.error('Google object not found on window');
      alert('Google Identity Services script chưa được tải. Vui lòng refresh trang.');
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      alert('Thiếu NEXT_PUBLIC_GOOGLE_CLIENT_ID trong file .env.local.');
      return;
    }

    try {
      console.log('Initializing Token Client with ClientID:', clientId);
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: (response: any) => {
          console.log('Google Auth Response:', response);
          if (response.error) {
            setError(response.error);
            alert('Lỗi Google: ' + response.error);
            return;
          }
          setAccessToken(response.access_token);
        },
      });

      console.log('Requesting access token...');
      client.requestAccessToken({ prompt: 'consent' }); // Thêm prompt consent để ép buộc hiện popup
    } catch (err: any) {
      console.error('Catch error in login:', err);
      alert('Lỗi khởi tạo: ' + err.message);
    }
  }, []);

  const listFiles = useCallback(async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchGoogleDriveFiles(token);
      setFiles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to list files');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    login,
    listFiles,
    accessToken,
    files,
    isLoading,
    error,
  };
}
