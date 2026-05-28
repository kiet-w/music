# Frontend - Update API and UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the frontend to allow users to select an album when importing from YouTube.

**Architecture:** Modify the `downloadFromYoutube` API function to support `albumId` and update the `Downloader` component to fetch albums and provide a selection dropdown.

**Tech Stack:** React, TypeScript, Next.js (next-intl), Lucide React, Framer Motion.

---

### Task 1: Update API call in `frontend/src/lib/api.ts`

**Files:**
- Modify: `frontend/src/lib/api.ts`

- [ ] **Step 1: Update `downloadFromYoutube` signature and implementation**

```typescript
export async function downloadFromYoutube(url: string, title: string, artist?: string, albumId?: string) {
  const res = await fetch(`${API_URL}/songs/youtube`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, title, artist, albumId }),
  });
  if (!res.ok) throw new Error('Failed to start download');
  return res.json();
}
```

- [ ] **Step 2: Verify API change (manual check of code)**

### Task 2: Update Downloader Component in `frontend/src/components/molecules/Downloader/Downloader.tsx`

**Files:**
- Modify: `frontend/src/components/molecules/Downloader/Downloader.tsx`

- [ ] **Step 1: Add state for albums and selected album ID**

```typescript
  const [albums, setAlbums] = useState<any[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
```

- [ ] **Step 2: Fetch albums on mount**

```typescript
  useEffect(() => {
    const loadAlbums = async () => {
      try {
        const data = await fetchAlbums();
        setAlbums(data);
      } catch (err) {
        console.error('Failed to load albums:', err);
      }
    };
    loadAlbums();
  }, []);
```

- [ ] **Step 3: Update `handleSubmit` to pass `selectedAlbumId`**

```typescript
    try {
      const song = await downloadFromYoutube(url, title, artist, selectedAlbumId || undefined);
      // ...
```

- [ ] **Step 4: Add Album selection UI**

```tsx
        <div className="grid grid-cols-2 gap-3">
          <Input 
            type="text" 
            placeholder="Song Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isDownloading}
            required
            className="bg-background/50 border-white/5 focus-visible:ring-primary/20 h-11 rounded-xl"
          />
          <Input 
            type="text" 
            placeholder="Artist (Optional)"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            disabled={isDownloading}
            className="bg-background/50 border-white/5 focus-visible:ring-primary/20 h-11 rounded-xl"
          />
        </div>
        <select
          value={selectedAlbumId}
          onChange={(e) => setSelectedAlbumId(e.target.value)}
          disabled={isDownloading}
          className="w-full h-11 rounded-xl bg-background/50 border-white/5 focus-visible:ring-primary/20 text-white/70 px-3 outline-none appearance-none"
        >
          <option value="">No Album (Single)</option>
          {albums.map((album) => (
            <option key={album.id} value={album.id}>
              {album.title}
            </option>
          ))}
        </select>
```

- [ ] **Step 5: Verify implementation**

Run: `npm run build` in `frontend` to ensure no type errors or build issues.
