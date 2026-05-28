# YouTube to MP3 & Album Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement YouTube URL to MP3 conversion with user-selected album assignment.

**Architecture:** Background job processing using BullMQ, `yt-dlp` for conversion, and Supabase for storage. Frontend UI updated with album selection.

**Tech Stack:** NestJS, BullMQ, yt-dlp, Prisma, React (Next.js), Supabase.

---

### Task 1: Infrastructure Setup

**Files:**
- N/A (Shell commands)

- [ ] **Step 1: Install yt-dlp**

Run: `pip3 install yt-dlp` or `pip install yt-dlp`
Expected: `yt-dlp` command becomes available.

- [ ] **Step 2: Verify yt-dlp installation**

Run: `yt-dlp --version`
Expected: Version string output.

---

### Task 2: Backend - Update DTO and Controller

**Files:**
- Modify: `backend/src/songs/dto/create-song-youtube.dto.ts`
- Modify: `backend/src/songs/song.controller.ts`

- [ ] **Step 1: Add albumId to CreateSongYoutubeDto**

```typescript
// backend/src/songs/dto/create-song-youtube.dto.ts
export class CreateSongYoutubeDto {
  @ApiProperty({ description: 'The YouTube URL' })
  url: string;

  @ApiProperty({ description: 'The title' })
  title: string;

  @ApiProperty({ description: 'The artist', required: false })
  artist?: string;

  @ApiProperty({ description: 'Optional Album ID', required: false })
  @IsOptional()
  @IsString()
  albumId?: string;
}
```

- [ ] **Step 2: Update SongController to pass albumId**

```typescript
// backend/src/songs/song.controller.ts
@Post('youtube')
async createFromYoutube(@Body() createSongDto: CreateSongYoutubeDto) {
  return this.songService.createFromYoutube(
    createSongDto.url,
    createSongDto.title,
    createSongDto.artist,
    createSongDto.albumId, // Pass this
  );
}
```

---

### Task 3: Backend - Update SongService

**Files:**
- Modify: `backend/src/songs/song.service.ts`

- [ ] **Step 1: Update createFromYoutube signature and logic**

```typescript
// backend/src/songs/song.service.ts
async createFromYoutube(url: string, title: string, artist?: string, albumId?: string) {
  let finalAlbumId = albumId;

  if (!finalAlbumId) {
    // Fallback to default album logic
    let defaultAlbum = await this.albumRepository.findMany({ where: { title: 'Default' }, take: 1 }).then(a => a[0]);
    if (!defaultAlbum) {
      defaultAlbum = await this.albumRepository.create({ data: { title: 'Default', artist: 'Various Artists' } });
    }
    finalAlbumId = defaultAlbum.id;
  }

  const song = await this.songRepository.create({
    data: {
      title,
      artist,
      url: '',
      albumId: finalAlbumId,
      sourceType: 'youtube',
    },
  });

  await this.conversionQueue.add('convert', { url, songId: song.id });
  return song;
}
```

---

### Task 4: Frontend - Update API and UI

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/components/molecules/Downloader/Downloader.tsx`

- [ ] **Step 1: Update downloadFromYoutube API call**

```typescript
// frontend/src/lib/api.ts
export const downloadFromYoutube = async (url: string, title: string, artist?: string, albumId?: string) => {
  const response = await fetch(`${API_URL}/songs/youtube`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, title, artist, albumId }),
  });
  return response.json();
};
```

- [ ] **Step 2: Add Album Selection to Downloader Component**

- Fetch albums using `fetchAlbums` (assuming it exists or needs to be added).
- Add a `<select>` or custom dropdown for albums.
- State management for `selectedAlbumId`.

---

### Task 5: Verification

- [ ] **Step 1: Run Backend and Redis**
- [ ] **Step 2: Perform E2E test from UI**
- [ ] **Step 3: Verify track creation and album link in DB**
