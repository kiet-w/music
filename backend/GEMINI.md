# Music Player & Downloader Backend (GEMINI.md)

This backend service manages music metadata, handles YouTube downloads/conversions, integrates with Google Drive, and serves as a bridge to Supabase Storage.

## Project Overview

- **Purpose:** A personal music management system that converts YouTube URLs to MP3s and indexes files from Google Drive.
- **Framework:** [NestJS](https://nestjs.com/) (TypeScript).
- **Database:** PostgreSQL via [Prisma ORM](https://www.prisma.io/).
- **Media Storage:** [Supabase Storage](https://supabase.com/storage) for hosting MP3 files.
- **Task Processing:** [BullMQ](https://docs.bullmq.io/) with Redis for asynchronous download and conversion jobs.
- **External Tools:** Uses `yt-dlp` (CLI) for robust YouTube downloading.
- **External Integrations:** Google Drive API for importing existing music libraries.

## Architecture & Workflow

### 1. Music Import (YouTube)
- User provides a YouTube URL.
- `SongService` creates a database record (with a placeholder URL) and adds a job to the `conversion` queue.
- `ConversionProcessor` (BullMQ worker) triggers `DownloaderService` (`yt-dlp`).
- The converted MP3 is uploaded to Supabase via `StorageService`.
- The database is updated with the public Supabase URL.
- Local temporary files are cleaned up immediately.

### 2. Music Import (Google Drive)
- Uses `GoogleDriveService` to list and stream files from the user's Drive.
- Supports Shared Drives and Shortcuts.

### 3. Data Model
- **Album:** Groups tracks, stores title, artist, and cover URL.
- **Track:** Stores title, artist, source URL, duration, and metadata.

## Building and Running

### Prerequisites
- Node.js & npm.
- Redis (for BullMQ).
- `yt-dlp` installed and available in the system PATH.
- PostgreSQL (Supabase recommended).

### Commands
- **Install:** `npm install`
- **Database Setup:** `npx prisma migrate dev`
- **Development:** `npm run start:dev` (starts NestJS with watch mode)
- **Production Build:** `npm run build`
- **Run Production:** `npm run start:prod`
- **Linting:** `npm run lint`
- **Formatting:** `npm run format`

### Testing
- **Unit Tests:** `npm run test`
- **E2E Tests:** `npm run test:e2e`

## Development Conventions

- **Prisma:** Always use port **6543** for database connections in production/pooling environments (Supabase mandate).
- **Validation:** All DTOs should use `class-validator` decorators. The `ValidationPipe` is enabled globally.
- **Error Handling & Logging:**
  - **Pino Standard:** Use `nestjs-pino` for all application logging. All services and components **MUST** use injected `PinoLogger` (using `@InjectPinoLogger()`) instead of the default NestJS `Logger`.
  - **Structured Logging:** Prefer structured logging by passing metadata objects as the first argument (e.g., `this.logger.info({ id }, 'Message')`) for better observability.
  - **Production Privacy:** Never log raw user URLs or full `stderr` from external tools (like `yt-dlp`) in production to protect user privacy and avoid leaking sensitive tokens/cookies.
  - **Error Classification:** Distinguish between specific failure modes (e.g., "Format unavailable", "Video private") rather than throwing generic errors.
  - **Contextual Logging:** Log enough context for debugging (exit codes, internal paths) but truncate external tool output (e.g., first 200 chars of `stderr`).
- **Error Handling:** Global `HttpExceptionFilter` ensures consistent error responses.
- **Interfaces:** Use `IDownloaderProvider` and `IStorageProvider` to allow for alternative implementations (e.g., swapping Supabase for S3).
- **Repositories:** Database logic is abstracted into repository classes (e.g., `SongRepository`).

## Key Files & Modules

- `src/songs/`: Core music metadata management.
- `src/downloader/`: Wrapper for `yt-dlp` CLI.
- `src/storage/`: Integration with Supabase Storage.
- `src/jobs/`: BullMQ processor for background tasks.
- `src/google-drive/`: Google Drive API integration.
- `prisma/schema.prisma`: Database schema definition.
