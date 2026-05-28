# Music Player & Downloader Design Spec

**Date:** 2026-05-23
**Status:** Approved
**Topic:** Initial Scaffolding and Core Features

## 1. Overview
A personal music application that allows users to download audio from YouTube, store it in Supabase Storage, and stream it via a React-based mobile-friendly player.

## 2. Architecture
The system consists of three main components:
- **Backend (NestJS):** Handles URL processing, `yt-dlp` conversion, and Supabase interaction.
- **Frontend (React + Vite):** User interface for searching/downloading and playing music.
- **Infrastructure (Supabase):** PostgreSQL database via Prisma and S3-compatible Object Storage.

## 3. Component Details

### 3.1 Backend (NestJS)
- **DownloaderModule:**
  - Wraps `yt-dlp` CLI.
  - Downloads audio and converts to MP3 (192kbps).
  - Emits progress events (optional).
- **StorageModule:**
  - Interfaces with Supabase `@supabase/supabase-js`.
  - Uploads MP3s to a private/public bucket.
  - Returns signed URLs for streaming.
- **LibraryModule:**
  - Uses Prisma to track song metadata (Title, Artist, Duration, Supabase Path).
  - Prisma connection: `postgresql://...:6543/postgres?pgbouncer=true`.

### 3.2 Frontend (React)
- **Downloader Component:** Simple input field for YouTube URLs.
- **Player Component:** Uses `Howler.js` for robust audio playback. Supports play/pause, seek, and volume.
- **Library View:** List of downloaded songs with play buttons.
- **Styling:** Vanilla CSS, mobile-first responsive design.

### 3.3 Data Flow
1. User enters YT URL on Frontend.
2. Frontend POSTs URL to Backend `/download`.
3. Backend triggers `yt-dlp` -> MP3.
4. Backend uploads MP3 to Supabase.
5. Backend saves metadata to DB.
6. Backend deletes local MP3.
7. Backend returns success to Frontend.
8. Frontend refreshes Library.

## 4. Technical Constraints
- **Prisma Port:** MUST use **6543** for Supabase.
- **Conversion:** MUST use `yt-dlp`.
- **Hosting:** Supabase for DB and Storage.
- **Client:** React + Howler.js.

## 5. Security & Legal
- For personal/offline use only.
- No public deployment of copyrighted material.
- Supabase credentials stored in `.env`.

## 6. Success Criteria
- [ ] Backend can successfully convert a YT URL to MP3.
- [ ] MP3 is stored in Supabase and meta is in DB.
- [ ] Frontend can list songs from the DB.
- [ ] Frontend can play a song via a streaming URL.
