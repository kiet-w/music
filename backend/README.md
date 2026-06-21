# Music App API (Backend)

## 📌 Overview
This is the backend API for the Music App, built with **NestJS** and **Prisma ORM**.
It handles authentication, user management, song/album data, cloud storage, messaging, and background jobs.

## 🚀 Technologies
- **Framework:** NestJS
- **Database:** PostgreSQL via Prisma ORM
- **Authentication:** JWT, Google OAuth
- **Storage:** Supabase Storage, Google Drive API

## 📂 Core Modules
- **Auth:** User registration, login, JWT verification, Google OAuth.
- **Albums & Songs:** Management of music tracks and album metadata.
- **Storage & Downloader:** File uploading, downloading, and background cleanup.
- **Messages:** Messaging and notifications handling.
- **Admin:** Administrative endpoints for app management.

## 📖 Documentation
Detailed technical documentation and Data Flow for every single module can be found in the [`backend-docs/`](./backend-docs/) folder.

## ⚙️ Getting Started
```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables (Check .env)
# Create encryption key using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Configure CORS_ORIGINS, ENCRYPTION_KEY, JWT_SECRET

# 3. Run database migrations
npx prisma migrate dev

# 4. Start development server
npm run start:dev
```

## 🔒 Production Hardening & Security Features

*   **Role-Based Access Control (RBAC)**: Added `@Roles()` decorator and `RolesGuard` mapping `UserRole` (`USER` | `ADMIN`) stored inside Prisma. Administrative controller `AdminController` and endpoint `/auth/users` are restricted to `ADMIN` users.
*   **Token Encryption**: Built an AES-256-GCM `EncryptionService` to automatically encrypt and decrypt `googleAccessToken` and `googleRefreshToken` stored in PostgreSQL. Legacy tokens are migrated automatically during module bootstrapping.
*   **Rate Limiting**: Configured `@nestjs/throttler` to prevent abuse. Critical endpoints such as authentication (`/auth/login`, `/auth/register`) and download (`/songs/youtube`) are throttled.
*   **yt-dlp Pinned Installer**: Pre-install is powered by a robust checksum installer `install-ytdlp.sh` that pins version `2026.06.09` and validates it against its SHA-256 signature to prevent supply-chain attacks.
*   **Audio Speed Optimization & Track Cache Reuse**: Reduced output quality from `320K` to `128K` to speed up ffmpeg encoding and reduce file sizes by 60% (for 2.5x faster upload speeds to Supabase Storage). Furthermore, `SongService` checks the database for existing tracks with the same `sourceId` (extracted YouTube ID) and a valid `url`. If found, it reuses the Supabase public URL instantly, avoiding redundant downloads, transcoding, and queue processing.
*   **Direct Track-to-User Relation**: Linked the `Track` model directly to the `User` model (`userId`) in Prisma schema. This optimizes backend API query performance (retrieving user track list with a direct query rather than joining the `Album` table) and enables secure server-side realtime update filtering.
*   **BullMQ Optimization**: Audio task workers restrict concurrency to `2` jobs maximum to preserve local CPU limits and employ a 3-retry exponential backoff delay scheme.
*   **BaseRepository Type Safety**: Removed loose types and abstracted parameters using type-safe Prisma delegate methods.
