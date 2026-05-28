const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

console.log('Current API_URL:', API_URL);

const headers = {
  'Content-Type': 'application/json',
  'bypass-tunnel-reminder': 'true',
  'ngrok-skip-browser-warning': 'true',
};

export async function fetchAlbums() {
  const res = await fetch(`${API_URL}/albums`, { 
    cache: 'no-store',
    headers: { 
      'bypass-tunnel-reminder': 'true',
      'ngrok-skip-browser-warning': 'true'
    }
  });
  if (!res.ok) throw new Error('Failed to fetch albums');
  return res.json();
}

export async function createAlbum(data: { title: string; artist?: string; coverUrl?: string }) {
  const res = await fetch(`${API_URL}/albums`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create album');
  return res.json();
}

export async function fetchTracks() {
  const res = await fetch(`${API_URL}/songs`, { 
    cache: 'no-store',
    headers: { 'bypass-tunnel-reminder': 'true' }
  });
  if (!res.ok) throw new Error('Failed to fetch tracks');
  return res.json();
}

export async function fetchAlbum(id: string) {
  const res = await fetch(`${API_URL}/albums/${id}`, { 
    cache: 'no-store',
    headers: { 'bypass-tunnel-reminder': 'true' }
  });
  if (!res.ok) throw new Error('Failed to fetch album');
  return res.json();
}

export async function fetchTrack(id: string) {
  const res = await fetch(`${API_URL}/songs/${id}`, { 
    cache: 'no-store',
    headers: { 'bypass-tunnel-reminder': 'true' }
  });
  if (!res.ok) throw new Error('Failed to fetch track');
  return res.json();
}

export async function downloadFromYoutube(url: string, title: string, artist?: string, albumId?: string) {
  const res = await fetch(`${API_URL}/songs/youtube`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url, title, artist, albumId }),
  });
  if (!res.ok) throw new Error('Failed to start download');
  return res.json();
}

export async function deleteTrack(id: string) {
  const res = await fetch(`${API_URL}/songs/${id}`, {
    method: 'DELETE',
    headers: { 'bypass-tunnel-reminder': 'true' }
  });
  if (!res.ok) throw new Error('Failed to delete track');
  return true;
}

export async function moveTrackToAlbum(id: string, albumId: string) {
  const res = await fetch(`${API_URL}/songs/${id}/move`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ albumId }),
  });
  if (!res.ok) throw new Error('Failed to move track');
  return res.json();
}

export async function fetchGoogleDriveFiles(token: string) {
  const res = await fetch(`${API_URL}/google-drive/files?token=${token}`, { 
    cache: 'no-store',
    headers: { 'bypass-tunnel-reminder': 'true' }
  });
  if (!res.ok) throw new Error('Failed to fetch Google Drive files');
  return res.json();
}

export async function importFromDrive(fileId: string, token: string, albumId?: string) {
  const res = await fetch(`${API_URL}/google-drive/import`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fileId, accessToken: token, albumId }),
  });
  if (!res.ok) throw new Error('Failed to import from Google Drive');
  return res.json();
}
