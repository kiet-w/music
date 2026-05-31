# Codegraph Overview

This document summarizes the three SQLite codegraph databases in the project:

- `.codegraph/codegraph.db`
- `backend/.codegraph/codegraph.db`
- `frontend/.codegraph/codegraph.db`

The goal is to give a fast, project-wide view of what each graph covers and how the backend and frontend fit together.

## 1. Graph Scope

### Root graph

The root `.codegraph` is the broadest view of the repository.

- Nodes: `682`
- Files indexed: `108`
- Edges: `1117`
- Unresolved refs: `0`

Node kinds in the root graph:

- `import`: `332`
- `file`: `105`
- `method`: `89`
- `function`: `54`
- `class`: `36`
- `constant`: `31`
- `interface`: `18`
- `route`: `14`
- `namespace`: `3`

Edge kinds in the root graph:

- `contains`: `559`
- `imports`: `332`
- `calls`: `161`
- `references`: `57`
- `implements`: `3`
- `extends`: `2`
- `instantiates`: `2`
- `decorates`: `1`

### Backend graph

The backend graph is a narrower NestJS-only view.

- Nodes: `375`
- Files indexed: `51`
- Edges: `604`
- Unresolved refs: `0`

Node kinds in the backend graph:

- `import`: `181`
- `method`: `86`
- `file`: `51`
- `class`: `33`
- `route`: `14`
- `constant`: `4`
- `function`: `4`
- `interface`: `2`

Edge kinds in the backend graph:

- `contains`: `310`
- `imports`: `181`
- `calls`: `55`
- `references`: `50`
- `implements`: `3`
- `extends`: `2`
- `instantiates`: `2`
- `decorates`: `1`

### Frontend graph

The frontend graph is the Next.js / React / Capacitor view.

- Nodes: `309`
- Files indexed: `57`
- Edges: `498`
- Unresolved refs: `0`

Node kinds in the frontend graph:

- `import`: `152`
- `file`: `55`
- `function`: `52`
- `constant`: `26`
- `interface`: `16`
- `class`: `3`
- `namespace`: `3`
- `method`: `2`

Edge kinds in the frontend graph:

- `contains`: `250`
- `imports`: `152`
- `calls`: `86`
- `references`: `10`

## 2. What the Project Is

This is a music application with:

- A NestJS backend for auth, albums, songs, Google Drive import, YouTube conversion, and storage
- A Next.js frontend for browsing, downloading, playing, and managing music
- Local offline playback support through Capacitor filesystem APIs
- Real-time refresh via Supabase subscriptions

## 3. Backend Structure

### Core modules

- `src/auth`: register, login, and `/auth/me`
- `src/albums`: album creation and retrieval
- `src/songs`: song creation from YouTube, listing, detail lookup, delete, and move-to-album
- `src/google-drive`: Drive file listing and import
- `src/storage`: Supabase storage upload, public URL lookup, and delete
- `src/downloader`: `yt-dlp` based download pipeline
- `src/jobs`: BullMQ conversion worker
- `src/admin`: admin cleanup and track deletion utilities
- `src/prisma`: Prisma wiring
- `src/common`: filters, interceptors, interfaces, repositories
- `src/core`: root controller/service

### Backend entry points

- `backend/src/main.ts` bootstraps Nest, CORS, validation, Swagger, logging, and global filters
- `backend/src/app.module.ts` wires together config, cache, logging, and feature modules

### Backend API surface

Routes captured in the graph and source:

- `GET /`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /albums`
- `GET /albums`
- `GET /albums/:id`
- `POST /songs/youtube`
- `GET /songs`
- `GET /songs/:id`
- `DELETE /songs/:id`
- `PATCH /songs/:id/move`
- `GET /google-drive/ping`
- `GET /google-drive/files`
- `POST /google-drive/import`
- `DELETE /admin/tracks/:id`
- `POST /admin/storage/cleanup`

## 4. Backend Data Flow

### Auth flow

1. Client registers or logs in through `/auth/register` or `/auth/login`
2. Backend hashes passwords with bcrypt and returns a JWT access token
3. Frontend stores the token in localStorage
4. `GET /auth/me` re-validates the session during hydration

### YouTube-to-library flow

1. Client posts `url`, `title`, `artist`, and optional `albumId` to `POST /songs/youtube`
2. `SongService` creates a song record
3. A BullMQ job is queued on `conversion`
4. `ConversionProcessor` downloads audio with `yt-dlp`
5. The file is uploaded to Supabase Storage
6. The track row is updated with the public URL
7. Temporary files are cleaned up

### Google Drive import flow

1. Frontend obtains a Google access token
2. Backend lists candidate audio files from Drive
3. Backend resolves shortcuts and filters audio-like files
4. Import endpoint downloads and stores the file into the library

### Album and song ownership

- User ownership is enforced by matching `userId` on album and song lookups
- A song can only be moved to an album owned by the same user
- Default albums are created lazily when the user imports a YouTube track without choosing an album

## 5. Frontend Structure

### App layer

- `src/app/[locale]` contains localized routes
- `layout.tsx` wraps the app with `NextIntlClientProvider`, `AuthGate`, `PlayerBar`, and `BottomTabBar`
- `page.tsx` and the localized feature pages render the main experience

### Shared frontend layers

- `src/components`: UI atoms, molecules, templates, auth, Google Drive, and layout pieces
- `src/hooks`: realtime sync and offline storage hooks
- `src/lib`: API client and Supabase setup
- `src/store`: Zustand stores for auth, albums, and player state
- `src/messages`: English and Vietnamese localization files

### Key frontend modules

- `src/lib/api.ts`: all backend fetch helpers
- `src/store/useAuthStore.ts`: token hydration, session persistence, and `/auth/me` verification
- `src/hooks/useSupabaseRealtime.ts`: Supabase table subscriptions for live refresh
- `src/hooks/useOfflineStorage.ts`: local file download and retrieval for offline playback
- `src/components/auth/AuthGate.tsx`: route protection and redirect logic
- `src/components/molecules/Library/Library.tsx`: track list, download/delete/move/play actions
- `src/app/[locale]/albums/AlbumsClient.tsx`: album browsing and creation
- `src/app/[locale]/HomePageClient.tsx`: album overview landing page

## 6. Frontend Data Flow

### Session hydration

1. `useAuthStore` reads persisted auth from localStorage
2. `AuthGate` waits for hydration
3. If the route is protected and there is no session, the user is redirected to login
4. If the token exists, `/auth/me` is called to validate it

### Album browsing

1. `HomePageClient` fetches albums from `GET /albums`
2. `AlbumsClient` fetches the same data and supports creation through `POST /albums`
3. Realtime events on the `Album` table refresh the UI automatically

### Library browsing

1. `Library` fetches tracks from `GET /songs`
2. Tracks can be played, deleted, moved to an album, or downloaded for offline use
3. Realtime events on the `Track` table refresh the list

### Offline playback

1. `useOfflineStorage` downloads a track to Capacitor filesystem storage
2. On web, it converts the file into a data URI
3. On native platforms, it returns a file URI through Capacitor

## 7. Most Connected Files

The following files are the busiest hubs in the graph and are the best starting points when reading the code:

- `backend/src/songs/song.controller.ts`
- `backend/src/albums/album.controller.ts`
- `backend/src/app.module.ts`
- `backend/src/google-drive/google-drive.controller.ts`
- `backend/src/jobs/conversion.processor.ts`
- `backend/src/songs/song.service.ts`
- `backend/src/storage/storage.service.ts`
- `frontend/src/components/templates/AlbumDetailClient.tsx`
- `frontend/src/components/molecules/Library/Library.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/components/molecules/Downloader/Downloader.tsx`
- `frontend/src/app/[locale]/albums/AlbumsClient.tsx`

## 8. Notes And Caveats

- `project_metadata` is empty in all three databases, so there is no embedded project summary to read from the graph itself.
- The graph captured the core backend routes and the main frontend modules, but the backend auth routes had to be confirmed from source because they were not surfaced in the route-node dump.
- The root graph is the best single place to understand cross-cutting relationships; the backend and frontend graphs are better when you want a focused view of one side only.

## 9. Practical Reading Order

If you are onboarding someone or reviewing the architecture, start here:

1. `backend/src/main.ts`
2. `backend/src/app.module.ts`
3. `backend/src/auth/auth.controller.ts`
4. `backend/src/albums/album.service.ts`
5. `backend/src/songs/song.service.ts`
6. `backend/src/jobs/conversion.processor.ts`
7. `frontend/src/store/useAuthStore.ts`
8. `frontend/src/app/[locale]/layout.tsx`
9. `frontend/src/components/molecules/Library/Library.tsx`
10. `frontend/src/lib/api.ts`

