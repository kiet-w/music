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

export async function register(data: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  
  if (res.status === 409) {
    throw new Error('Email already exists');
  }
  
  if (!res.ok) {
    throw new Error('Registration failed');
  }
  
  return res.json();
}

export async function login(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  
  if (res.status === 401) {
    throw new Error('Invalid email or password');
  }
  
  if (!res.ok) {
    throw new Error('Login failed');
  }
  
  return res.json();
}

export async function fetchMe(appToken: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: getAuthHeaders(appToken),
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch user profile');
  }
  
  return res.json();
}

export async function fetchAlbums(appToken: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}/albums`, { 
    ...options,
    headers: getAuthHeaders(appToken)
  });
  if (!res.ok) throw new Error('Failed to fetch albums');
  return res.json();
}

export async function createAlbum(appToken: string, data: { title: string; artist?: string; coverUrl?: string }) {
  const res = await fetch(`${API_URL}/albums`, {
    method: 'POST',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create album');
  return res.json();
}

export async function fetchTracks(appToken: string) {
  const res = await fetch(`${API_URL}/songs`, { 
    cache: 'no-store',
    headers: getAuthHeaders(appToken)
  });
  if (!res.ok) throw new Error('Failed to fetch tracks');
  return res.json();
}

export async function fetchAlbum(appToken: string, id: string) {
  const res = await fetch(`${API_URL}/albums/${id}`, { 
    cache: 'no-store',
    headers: getAuthHeaders(appToken)
  });
  if (!res.ok) throw new Error('Failed to fetch album');
  return res.json();
}

export async function fetchTrack(appToken: string, id: string) {
  const res = await fetch(`${API_URL}/songs/${id}`, { 
    cache: 'no-store',
    headers: getAuthHeaders(appToken)
  });
  if (!res.ok) throw new Error('Failed to fetch track');
  return res.json();
}

export async function downloadFromYoutube(appToken: string, url: string, title: string, artist?: string, albumId?: string) {
  const res = await fetch(`${API_URL}/songs/youtube`, {
    method: 'POST',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify({ url, title, artist, albumId }),
  });
  if (!res.ok) throw new Error('Failed to start download');
  return res.json();
}

export async function deleteTrack(appToken: string, id: string) {
  const res = await fetch(`${API_URL}/songs/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(appToken)
  });
  if (!res.ok) throw new Error('Failed to delete track');
  return true;
}

export async function moveTrackToAlbum(appToken: string, id: string, albumId: string) {
  const res = await fetch(`${API_URL}/songs/${id}/move`, {
    method: 'PATCH',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify({ albumId }),
  });
  if (!res.ok) throw new Error('Failed to move track');
  return res.json();
}

export async function fetchGoogleDriveFiles(appToken: string, googleAccessToken: string) {
  const res = await fetch(`${API_URL}/google-drive/files?token=${googleAccessToken}`, { 
    cache: 'no-store',
    headers: getAuthHeaders(appToken)
  });
  if (!res.ok) throw new Error('Failed to fetch Google Drive files');
  return res.json();
}

export async function importFromDrive(appToken: string, fileId: string, googleAccessToken: string, albumId?: string) {
  const res = await fetch(`${API_URL}/google-drive/import`, {
    method: 'POST',
    headers: getAuthHeaders(appToken),
    body: JSON.stringify({ fileId, accessToken: googleAccessToken, albumId }),
  });
  if (!res.ok) throw new Error('Failed to import from Google Drive');
  return res.json();
}
