const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
// Remove trailing slash if exists to prevent double slashes in paths
const API_URL = RAW_API_URL.replace(/\/$/, '');

const RAW_PYTHON_API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL ?? 'http://localhost:8001';
export const PYTHON_API_URL = RAW_PYTHON_API_URL.replace(/\/$/, '');

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
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
  const res = await fetch(url, options);

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

/**
 * Unwrap backend response — extracts `.data` if present, with optional fallback for list endpoints.
 */
function unwrap<T>(result: any, fallback?: T): T {
  const value = result?.data ?? result;
  return fallback !== undefined ? (value ?? fallback) : value;
}

/**
 * Authenticated GET request helper.
 */
async function apiGet<T = any>(path: string, appToken: string, options?: RequestInit & { fallback?: T }): Promise<T> {
  const { fallback, ...fetchOptions } = options ?? {};
  const result = await customFetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers: getAuthHeaders(appToken),
  });
  return unwrap<T>(result, fallback as T);
}

/**
 * Authenticated POST request helper.
 */
async function apiPost<T = any>(path: string, appToken: string, body?: any): Promise<T> {
  const result = await customFetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(appToken),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return unwrap<T>(result);
}

/**
 * Authenticated PATCH request helper.
 */
async function apiPatch<T = any>(path: string, appToken: string, body?: any): Promise<T> {
  const result = await customFetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: getAuthHeaders(appToken),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return unwrap<T>(result);
}

/**
 * Authenticated DELETE request helper.
 */
async function apiDelete(path: string, appToken: string): Promise<void> {
  await customFetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: getAuthHeaders(appToken),
  });
}

export async function register(data: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthResponse> {
  return customFetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
}

export async function googleLogin(idToken: string): Promise<AuthResponse> {
  return customFetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ idToken }),
  });
}

export async function googleUnifiedLogin(code: string, redirectUri?: string): Promise<AuthResponse> {
  return customFetch(`${API_URL}/auth/google-unified`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ code, redirectUri }),
  });
}

export async function login(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return customFetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
}

export async function fetchMe(appToken: string): Promise<AuthUser> {
  return customFetch(`${API_URL}/auth/me`, {
    headers: getAuthHeaders(appToken),
  });
}

export async function fetchAlbums(appToken: string, options?: RequestInit) {
  return apiGet('/albums', appToken, { ...options, fallback: [] as any[] });
}

export async function createAlbum(appToken: string, data: { title: string; artist?: string; coverUrl?: string }) {
  return apiPost('/albums', appToken, data);
}

export async function fetchTracks(appToken: string) {
  return apiGet('/songs', appToken, { cache: 'no-store', fallback: [] as any[] });
}

export async function fetchAlbum(appToken: string, id: string) {
  return apiGet(`/albums/${id}`, appToken, { cache: 'no-store' });
}

export async function fetchTrack(appToken: string, id: string) {
  return apiGet(`/songs/${id}`, appToken, { cache: 'no-store' });
}

export async function downloadFromYoutube(appToken: string, url: string, title: string, artist?: string, albumId?: string) {
  return apiPost('/songs/youtube', appToken, { url, title, artist, albumId });
}

export async function deleteTrack(appToken: string, id: string) {
  await apiDelete(`/songs/${id}`, appToken);
  return true;
}

export async function moveTrackToAlbum(appToken: string, id: string, albumId: string) {
  return apiPatch(`/songs/${id}/move`, appToken, { albumId });
}

export async function fetchGoogleDriveAuthUrl(appToken: string) {
  return apiGet('/google-drive/auth-url', appToken);
}

export async function fetchGoogleDriveStatus(appToken: string) {
  return apiGet('/auth/google/status', appToken);
}

export async function importMusic(appToken: string, fileId: string, fileName: string, driveToken?: string, albumId?: string) {
  return apiPost('/music/import', appToken, { fileId, fileName, driveToken, albumId });
}

export async function exchangeGoogleDriveCode(appToken: string, code: string, state: string) {
  return apiPost('/google-drive/exchange-code', appToken, { code, state });
}

export async function fetchGoogleDriveFiles(appToken: string): Promise<any> {
  return apiGet('/google-drive/files', appToken, { cache: 'no-store', fallback: [] as any[] });
}

export async function importFromDrive(appToken: string, fileId: string, albumId?: string) {
  return apiPost('/google-drive/import', appToken, { fileId, albumId });
}

export async function sendMessage(appToken: string, receiverId: string, content: string) {
  return apiPost('/messages', appToken, { receiverId, content });
}

export async function fetchChatHistory(appToken: string, userId: string) {
  return apiGet(`/messages/${userId}`, appToken, { cache: 'no-store', fallback: [] as any[] });
}

export async function fetchUsers(appToken: string) {
  try {
    return await apiGet('/auth/users', appToken, { fallback: [] as any[] });
  } catch {
    return [];
  }
}

export async function createInvite(appToken: string, receiverId?: string) {
  return apiPost('/friend-requests/invite', appToken, { receiverId });
}

export async function getInviteInfo(token: string) {
  const result = await customFetch(`${API_URL}/friend-requests/info/${token}`, {
    cache: 'no-store',
  });
  return unwrap(result);
}

export async function acceptInvite(appToken: string, token: string) {
  return apiPost(`/friend-requests/accept/${token}`, appToken);
}
