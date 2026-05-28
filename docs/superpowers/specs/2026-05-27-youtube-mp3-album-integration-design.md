# YouTube to MP3 Conversion & Album Integration Design

**Goal:** Enable users to import songs from YouTube URLs, convert them to MP3, and assign them to specific albums.

## 1. Infrastructure Requirements

- **yt-dlp:** Must be installed and accessible in the system PATH.
- **ffmpeg:** Already installed, used by `yt-dlp` for MP3 extraction.
- **Redis:** Already running, used by BullMQ for background jobs.
- **Supabase Storage:** Already configured for file hosting.

## 2. Backend Changes

### 2.1. API Layer
- **Modify `CreateSongYoutubeDto`**: Add an optional `albumId` field (string).
- **Update `SongController`**: Pass the `albumId` to the `SongService`.

### 2.2. Service Layer
- **Update `SongService.createFromYoutube`**:
  - Accept `albumId` as an optional parameter.
  - If `albumId` is provided, verify the album exists.
  - If not provided, fallback to the "Default" album logic.
  - Create the `Track` record with the appropriate `albumId`.

### 2.3. Conversion Processor
- No significant changes needed to `ConversionProcessor` as it already handles the download, upload, and URL update based on `songId`.

## 3. Frontend Changes

### 3.1. API Client
- **Update `downloadFromYoutube`**: Modify the function in `@/lib/api` to accept an optional `albumId`.

### 3.2. UI Components
- **`Downloader` Molecule**:
  - Add an "Album" select field.
  - Fetch existing albums to populate the dropdown.
  - Pass the selected `albumId` to the API call.
  - Default to a "No Album / Default" option.

## 4. Implementation Steps

1. **Infrastructure**: Install `yt-dlp`.
2. **Backend**: Update DTO, Controller, and Service.
3. **Frontend**: Update API client and Downloader UI.
4. **Verification**: E2E test of the flow (URL -> Conversion -> Album Assignment).

## 5. Success Criteria
- [ ] `yt-dlp` is installed and functioning.
- [ ] User can select an album in the Downloader UI.
- [ ] Songs imported from YouTube are correctly linked to the selected album in the database.
- [ ] MP3 files are correctly uploaded to Supabase and playable.
