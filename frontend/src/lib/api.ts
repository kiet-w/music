const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002';
// Remove trailing slash if exists to prevent double slashes in paths
const API_URL = RAW_API_URL.replace(/\/$/, '');

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
  'bypass-tunnel-reminder': 'true',
  'ngrok-skip-browser-warning': 'true',
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
      // Potentially clear local storage or redirect to login
      console.warn('Unauthorized access detected, consider redirecting to login');
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
  return customFetch(`${API_URL}/albums`, { 
    ...options,
    headers: getAuthHeaders(appToken)
  });
}

export async function createAlbum(appToken: string, data: { title: string; artist?: string; coverUrl?: string }) {
  return customFetch(`${API_URL}/albums`, {
    method: 'POST',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify(data),
  });
}

export async function fetchTracks(appToken: string) {
  const result = await customFetch(`${API_URL}/songs`, { 
    cache: 'no-store',
    headers: getAuthHeaders(appToken)
  });
  return result.data ? result.data : result;
}

export async function fetchAlbum(appToken: string, id: string) {
  return customFetch(`${API_URL}/albums/${id}`, { 
    cache: 'no-store',
    headers: getAuthHeaders(appToken)
  });
}

export async function fetchTrack(appToken: string, id: string) {
  return customFetch(`${API_URL}/songs/${id}`, { 
    cache: 'no-store',
    headers: getAuthHeaders(appToken)
  });
}

export async function downloadFromYoutube(appToken: string, url: string, title: string, artist?: string, albumId?: string) {
  return customFetch(`${API_URL}/songs/youtube`, {
    method: 'POST',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify({ url, title, artist, albumId }),
  });
}

export async function deleteTrack(appToken: string, id: string) {
  await customFetch(`${API_URL}/songs/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(appToken)
  });
  return true;
}

export async function moveTrackToAlbum(appToken: string, id: string, albumId: string) {
  return customFetch(`${API_URL}/songs/${id}/move`, {
    method: 'PATCH',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify({ albumId }),
  });
}

export async function fetchGoogleDriveAuthUrl(appToken: string) {
  return customFetch(`${API_URL}/google-drive/auth-url`, {
    headers: getAuthHeaders(appToken)
  });
}

export async function fetchGoogleDriveStatus(appToken: string) {
  return customFetch(`${API_URL}/auth/google/status`, {
    headers: getAuthHeaders(appToken)
  });
}

export async function importMusic(appToken: string, fileId: string, fileName: string, driveToken?: string, albumId?: string) {
  return customFetch(`${API_URL}/music/import`, {
    method: 'POST',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify({ fileId, fileName, driveToken, albumId }),
  });
}

export async function exchangeGoogleDriveCode(appToken: string, code: string, state: string) {
  return customFetch(`${API_URL}/google-drive/exchange-code`, {
    method: 'POST',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify({ code, state }),
  });
}

export async function fetchGoogleDriveFiles(appToken: string) {
  return customFetch(`${API_URL}/google-drive/files`, { 
    cache: 'no-store',
    headers: getAuthHeaders(appToken)
  });
}

export async function importFromDrive(appToken: string, fileId: string, albumId?: string) {
  return customFetch(`${API_URL}/google-drive/import`, {
    method: 'POST',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify({ fileId, albumId }),
  });
}

export async function sendMessage(appToken: string, receiverId: string, content: string) {
  return customFetch(`${API_URL}/messages`, {
    method: 'POST',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify({ receiverId, content }),
  });
}

export async function fetchChatHistory(appToken: string, userId: string) {
  return customFetch(`${API_URL}/messages/${userId}`, {
    cache: 'no-store',
    headers: getAuthHeaders(appToken),
  });
}

export async function fetchUsers(appToken: string) {
  try {
    const result = await customFetch(`${API_URL}/auth/users`, {
      headers: getAuthHeaders(appToken),
    });
    return result.data ? result.data : result;
  } catch {
    return [];
  }
}

export async function createInvite(appToken: string, receiverId?: string) {
  return customFetch(`${API_URL}/friend-requests/invite`, {
    method: 'POST',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify({ receiverId }),
  });
}

export async function getInviteInfo(token: string) {
  return customFetch(`${API_URL}/friend-requests/info/${token}`, {
    cache: 'no-store',
  });
}

export async function acceptInvite(appToken: string, token: string) {
  return customFetch(`${API_URL}/friend-requests/accept/${token}`, {
    method: 'POST',
    headers: getAuthHeaders(appToken),
  });
}
