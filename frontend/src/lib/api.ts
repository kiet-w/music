const isServer = typeof window === 'undefined';
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    console.warn('[API Warning] NEXT_PUBLIC_API_URL is missing in production environment. Using default fallback.');
  }
  if (!process.env.NEXT_PUBLIC_PYTHON_API_URL) {
    console.warn('[API Warning] NEXT_PUBLIC_PYTHON_API_URL is missing in production environment. Using default fallback.');
  }
}

const DEFAULT_API_FALLBACK = 'https://section-affair-convertible-beds.trycloudflare.com';

const rawApi = process.env.NEXT_PUBLIC_API_URL;
export const API_URL = (
  rawApi && !rawApi.includes('localhost') && !rawApi.includes('127.0.0.1')
    ? rawApi
    : DEFAULT_API_FALLBACK
).replace(/\/$/, '');

const RAW_PYTHON_API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8001';
export const PYTHON_API_URL = RAW_PYTHON_API_URL.replace(/\/$/, '');

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
};

export type AuthResponse = {
  accessToken?: string;
  user?: AuthUser;
  message?: string;
  requiresVerification?: boolean;
};

const headers = {
  'Content-Type': 'application/json',
};

export function getAuthHeaders(appToken?: string) {
  return {
    ...headers,
    ...(appToken ? { Authorization: `Bearer ${appToken}` } : {}),
  };
}

/**
 * Custom fetch wrapper to handle standardized backend error responses
 */
async function customFetch(url: string, options: RequestInit = {}) {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      const error = new Error('Hydration timeout');
      (error as any).code = 'ERR_TIMEOUT';
      (error as any).status = 408;
      (error as any).originalError = err;
      throw error;
    }
    const error = new Error('Lỗi kết nối mạng: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền.');
    (error as any).code = 'ERR_NETWORK';
    (error as any).status = 0;
    (error as any).originalError = err;
    throw error;
  }

  if (!res.ok) {
    let errorBody;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = { message: `Request failed with status ${res.status}`, code: 'ERR_UNKNOWN' };
    }

    const error = new Error(errorBody.message || 'An unexpected error occurred');
    (error as any).code = errorBody.code;
    (error as any).status = res.status;
    
    // Global error side effects (e.g. redirecting on 401) can be added here
    if (res.status === 401 && typeof window !== 'undefined') {
      import('@/store/useAuthStore')
        .then(async ({ useAuthStore }) => {
          await useAuthStore.getState().clearSession();
          
          let locale = 'vi';
          const pathSegments = window.location.pathname.split('/');
          if (pathSegments[1] && pathSegments[1].length === 2) {
            locale = pathSegments[1];
          } else {
            locale = localStorage.getItem('NEXT_LOCALE') || 'vi';
          }

          if (!window.location.pathname.endsWith('/login')) {
            window.location.href = `/${locale}/login`;
          }
        })
        .catch((err) => {
          console.error('Failed to clear session on 401:', err);
          let locale = 'vi';
          try {
            locale = localStorage.getItem('NEXT_LOCALE') || 'vi';
          } catch {}
          if (!window.location.pathname.endsWith('/login')) {
            window.location.href = `/${locale}/login`;
          }
        });
    }

    throw error;
  }

  return res.json();
}

export async function register(data: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthResponse> {
  const result = await customFetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return result?.data ?? result;
}

export async function googleLogin(idToken: string): Promise<AuthResponse> {
  const result = await customFetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ idToken }),
  });
  return result?.data ?? result;
}

export async function googleUnifiedLogin(code: string, redirectUri?: string): Promise<AuthResponse> {
  const result = await customFetch(`${API_URL}/auth/google-unified`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ code, redirectUri }),
  });
  return result?.data ?? result;
}

export async function login(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const result = await customFetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return result?.data ?? result;
}

export async function verifyOtp(data: {
  email: string;
  otp: string;
}): Promise<AuthResponse> {
  const result = await customFetch(`${API_URL}/auth/verify-otp`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return result?.data ?? result;
}

export async function resendOtp(email: string): Promise<{ message: string }> {
  const result = await customFetch(`${API_URL}/auth/resend-otp`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email }),
  });
  return result?.data ?? result;
}

export async function forgotPassword(email: string): Promise<{ message: string; otp?: string }> {
  const result = await customFetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email }),
  });
  return result?.data ?? result;
}

export async function resetPassword(data: {
  email: string;
  otp: string;
  newPassword: string;
}): Promise<{ message: string }> {
  const result = await customFetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return result?.data ?? result;
}

export async function fetchMe(appToken: string, options?: RequestInit): Promise<AuthUser> {
  const result = await customFetch(`${API_URL}/auth/me`, {
    ...options,
    headers: {
      ...getAuthHeaders(appToken),
      ...options?.headers,
    },
  });
  return result?.data ?? result;
}

export async function updateProfile(appToken: string, data: { name?: string; avatarUrl?: string }): Promise<AuthUser> {
  const result = await customFetch(`${API_URL}/auth/profile`, {
    method: 'PATCH',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify(data),
  });
  return result?.data ?? result;
}

export async function uploadImage(appToken: string, file: File, folder = 'general'): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/uploads/image?folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${appToken}`,
    },
    body: formData,
  });

  if (!res.ok) {
    let errorBody;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = { message: 'Failed to upload image' };
    }
    throw new Error(errorBody.message || 'Lỗi khi tải ảnh lên máy chủ');
  }

  const result = await res.json();
  const data = result?.data ?? result;
  const fullUrl = data.url?.startsWith('http') ? data.url : `${API_URL}${data.url}`;
  return { url: fullUrl, filename: data.filename };
}

export async function changePassword(appToken: string, data: { currentPassword?: string; newPassword: string }): Promise<{ message: string }> {
  const result = await customFetch(`${API_URL}/auth/change-password`, {
    method: 'PATCH',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify(data),
  });
  return result?.data ?? result;
}

function extractArrayData<T = any>(result: any): T[] {
  const data = result?.data ?? result;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export async function fetchAlbums(appToken: string, options?: RequestInit) {
  const result = await customFetch(`${API_URL}/albums`, { 
    ...options,
    headers: getAuthHeaders(appToken)
  });
  return extractArrayData(result);
}

export async function createAlbum(appToken: string, data: { title: string; artist?: string; coverUrl?: string }) {
  const result = await customFetch(`${API_URL}/albums`, {
    method: 'POST',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify(data),
  });
  return result?.data ?? result;
}

export async function updateAlbum(appToken: string, id: string, data: { title?: string; artist?: string; coverUrl?: string }) {
  const result = await customFetch(`${API_URL}/albums/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify(data),
  });
  return result?.data ?? result;
}

export async function fetchTracks(appToken: string, albumId?: string) {
  const params = new URLSearchParams({ limit: '100' });
  if (albumId) params.set('albumId', albumId);
  const result = await customFetch(`${API_URL}/songs?${params}`, { 
    cache: 'no-store',
    headers: getAuthHeaders(appToken)
  });
  return extractArrayData(result);
}

export async function fetchAlbum(appToken: string, id: string) {
  const result = await customFetch(`${API_URL}/albums/${id}`, { 
    cache: 'no-store',
    headers: getAuthHeaders(appToken)
  });
  return result?.data ?? result;
}

export async function fetchTrack(appToken: string, id: string) {
  const result = await customFetch(`${API_URL}/songs/${id}`, { 
    cache: 'no-store',
    headers: getAuthHeaders(appToken)
  });
  return result?.data ?? result;
}

export async function fetchYoutubeInfo(appToken: string, url: string) {
  const result = await customFetch(`${API_URL}/songs/youtube/info?url=${encodeURIComponent(url)}`, {
    headers: getAuthHeaders(appToken),
  });
  return result?.data ?? result;
}

export async function downloadFromYoutube(appToken: string, url: string, title: string, artist?: string, albumId?: string) {
  const result = await customFetch(`${API_URL}/songs/youtube`, {
    method: 'POST',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify({ url, title, artist, albumId }),
  });
  return result?.data ?? result;
}

export async function deleteTrack(appToken: string, id: string) {
  await customFetch(`${API_URL}/songs/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(appToken)
  });
  return true;
}

export async function moveTrackToAlbum(appToken: string, id: string, albumId: string) {
  const result = await customFetch(`${API_URL}/songs/${id}/move`, {
    method: 'PATCH',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify({ albumId }),
  });
  return result?.data ?? result;
}

export async function fetchGoogleDriveAuthUrl(appToken: string) {
  const result = await customFetch(`${API_URL}/google-drive/auth-url`, {
    headers: getAuthHeaders(appToken)
  });
  return result?.data ?? result;
}

export async function fetchGoogleDriveStatus(appToken: string) {
  const result = await customFetch(`${API_URL}/auth/google/status`, {
    headers: getAuthHeaders(appToken)
  });
  return result?.data ?? result;
}

export async function importMusic(appToken: string, fileId: string, fileName: string, driveToken?: string, albumId?: string) {
  const result = await customFetch(`${API_URL}/music/import`, {
    method: 'POST',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify({ fileId, fileName, driveToken, albumId }),
  });
  return result?.data ?? result;
}

export async function exchangeGoogleDriveCode(appToken: string, code: string, state: string) {
  const result = await customFetch(`${API_URL}/google-drive/exchange-code`, {
    method: 'POST',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify({ code, state }),
  });
  return result?.data ?? result;
}

export async function fetchGoogleDriveFiles(appToken: string) {
  const result = await customFetch(`${API_URL}/google-drive/files`, { 
    cache: 'no-store',
    headers: getAuthHeaders(appToken)
  });
  return extractArrayData(result);
}

export async function importFromDrive(appToken: string, fileId: string, albumId?: string) {
  const result = await customFetch(`${API_URL}/google-drive/import`, {
    method: 'POST',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify({ fileId, albumId }),
  });
  return result?.data ?? result;
}

export async function sendMessage(appToken: string, receiverId: string, content: string) {
  const result = await customFetch(`${API_URL}/messages`, {
    method: 'POST',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify({ receiverId, content }),
  });
  return result?.data ?? result;
}

export async function fetchChatHistory(appToken: string, userId: string, before?: string, limit: number = 30) {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (before) params.set('before', before);

  const result = await customFetch(`${API_URL}/messages/${userId}?${params}`, {
    cache: 'no-store',
    headers: getAuthHeaders(appToken),
  });
  return extractArrayData(result);
}

export async function fetchUsers(appToken: string) {
  const result = await customFetch(`${API_URL}/auth/users`, {
    headers: getAuthHeaders(appToken),
  });
  return extractArrayData(result);
}

export async function fetchFriends(appToken: string) {
  const result = await customFetch(`${API_URL}/messages/friends`, {
    cache: 'no-store',
    headers: getAuthHeaders(appToken),
  });
  return extractArrayData(result);
}

export async function createInvite(appToken: string, receiverId?: string) {
  const result = await customFetch(`${API_URL}/messages/invite`, {
    method: 'POST',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify({ receiverId }),
  });
  return result?.data ?? result;
}

export async function getInviteInfo(token: string) {
  const result = await customFetch(`${API_URL}/messages/invite/info/${token}`, {
    cache: 'no-store',
  });
  return result?.data ?? result;
}

export async function acceptInvite(appToken: string, token: string) {
  const result = await customFetch(`${API_URL}/messages/invite/accept/${token}`, {
    method: 'POST',
    headers: getAuthHeaders(appToken),
  });
  return result?.data ?? result;
}

export async function reactToMessage(appToken: string, messageId: string, emoji: string) {
  const result = await customFetch(`${API_URL}/messages/react`, {
    method: 'POST',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify({ messageId, emoji }),
  });
  return result?.data ?? result;
}
