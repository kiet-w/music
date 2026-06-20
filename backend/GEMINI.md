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
- **Module/Folder Structure:** Chia các feature/domain ra thành các folder riêng biệt theo chức năng (VD: `notes`, `songs`). Mỗi folder/module bắt buộc phải tách biệt các file `dto`, `repository`, `service`, `controller`.
- **Repositories:** Database logic is abstracted into repository classes (e.g., `SongRepository`). Khuyến khích sử dụng một `BaseRepository` (root repository) cho các query lặp lại nhiều lần.

## Backend Structure (NestJS)
*Always check existing modules and components before creating new ones.*

### Core Modules (`src/`)
- **AppModule / CoreModule:** Root application bootstrapping.
- **PrismaModule:** Database connection (`PrismaService`).
- **JobsModule:** Background task processing (`ConversionProcessor` via BullMQ).
- **CommonModule / Common:** Shared utilities (`HttpExceptionFilter`, `LoggingInterceptor`, Base Repositories, Interfaces).

### Feature Modules & Endpoints
1. **AdminModule** (`/admin`)
   - `DELETE /admin/tracks/:id`
   - `POST /admin/storage/cleanup`
2. **AlbumsModule** (`/albums`)
   - `POST /albums`
   - `GET /albums`
   - `GET /albums/:id`
3. **AuthModule** (`/auth`)
   - `POST /auth/register`
   - `POST /auth/login`
   - `GET /auth/me`
4. **GoogleDriveModule** (`/google-drive`)
   - `GET /google-drive/ping`
   - `GET /google-drive/files`
   - `POST /google-drive/import`
5. **SongsModule** (`/songs`)
   - `POST /songs/youtube`
   - `GET /songs`
   - `GET /songs/:id`
   - `DELETE /songs/:id`
   - `PATCH /songs/:id/move`
6. **DownloaderModule** & **StorageModule**: Internal services for `yt-dlp` processing and Supabase storage (No direct endpoints).

### DTOs (Data Transfer Objects)
- **Albums:** `CreateAlbumDto`, `AlbumResponseDto`
- **Auth:** `LoginDto`, `RegisterDto`, `AuthResponseDto`
- **Google Drive:** `ImportDto`
- **Songs:** `CreateSongYoutubeDto`, `SongResponseDto`

### Guards & Decorators
- `JwtAuthGuard`: Protects endpoints requiring authentication (`src/auth/jwt-auth.guard.ts`).
- `@CurrentUser()`: Custom decorator to extract the user payload from the request (`src/auth/current-user.decorator.ts`).

### Repositories
- Data access is strictly handled via repository classes extending `BaseRepository`:
  - `UserRepository`
  - `AlbumRepository`
  - `SongRepository`

## Key Files (Miscellaneous)
- `prisma/schema.prisma`: Database schema definition.
