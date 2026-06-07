# Codegraph Overview

Generated from the three checked-in CodeGraph SQLite databases:

- `.codegraph/codegraph.db`
- `backend/.codegraph/codegraph.db`
- `frontend/.codegraph/codegraph.db`

The root graph is the broadest view and includes both backend and frontend paths. The backend and frontend graphs are narrower views that are easier to query when the area of interest is already known.

## Database Inventory

| Graph | Files | Nodes | Edges | Unresolved refs | Notes |
| --- | ---: | ---: | ---: | ---: | --- |
| Root | 108 | 682 | 1,117 | 0 | Cross-project graph covering backend, frontend, Android/Capacitor files, and shared config. |
| Backend | 51 | 375 | 604 | 0 | Focused NestJS graph. |
| Frontend | 57 | 309 | 498 | 0 | Focused Next.js/Capacitor graph. |

## Schema

Each database uses the same core tables:

- `files`: indexed file path, language, size, timestamps, node count, and file-level errors.
- `nodes`: indexed symbols such as files, imports, classes, methods, functions, interfaces, constants, and routes.
- `edges`: relationships between nodes. The observed relationship kinds are `contains`, `imports`, `calls`, and `references`.
- `unresolved_refs`: references the indexer could not resolve. All three current graphs report `0`.
- `nodes_fts` and related `nodes_fts_*` tables: full-text search index for node lookup.
- `schema_versions`: graph schema version tracking.
- `project_metadata`: present but currently empty.

## Language Coverage

| Graph | Languages |
| --- | --- |
| Root | TypeScript: 61 files / 435 nodes; TSX: 25 / 194; XML: 10 / 10; JavaScript: 6 / 23; Java: 3 / 20; properties: 2 / 0; YAML: 1 / 0 |
| Backend | TypeScript: 49 files / 365 nodes; JavaScript: 2 / 10 |
| Frontend | TSX: 27 files / 200 nodes; TypeScript: 11 / 66; XML: 10 / 10; JavaScript: 4 / 13; Java: 3 / 20; properties: 2 / 0 |

## Node And Edge Shape

The backend graph is controller/service heavy:

- Top node kinds: `import` 181, `method` 86, `file` 51, `class` 33, `route` 14.
- Edge kinds: `contains` 310, `imports` 181, `calls` 55, `references` 50.

The frontend graph is component/helper heavy:

- Top node kinds: `import` 152, `file` 55, `function` 52, `constant` 26, `interface` 16, `class` 3.
- Edge kinds: `contains` 250, `imports` 152, `calls` 10.

The root graph combines both:

- Top node kinds: `import` 332, `file` 105, `method` 89, `function` 54, `class` 36, `constant` 31, `interface` 18, `route` 14.
- Edge kinds: `contains` 559, `imports` 332, `calls` 161, `references` 57.

## High-Density Files

These files have the highest indexed node counts and are good starting points for manual reading.

Backend:

- `backend/src/songs/song.controller.ts`
- `backend/src/albums/album.controller.ts`
- `backend/src/app.module.ts`
- `backend/src/google-drive/google-drive.controller.ts`
- `backend/src/jobs/conversion.processor.ts`
- `backend/src/songs/song.service.ts`
- `backend/src/storage/storage.service.ts`
- `backend/src/albums/dto/album-response.dto.ts`
- `backend/src/downloader/downloader.service.ts`
- `backend/src/admin/admin.controller.ts`
- `backend/src/songs/dto/song-response.dto.ts`
- `backend/src/common/repositories/base.repository.ts`

Frontend:

- `frontend/src/components/templates/AlbumDetailClient.tsx`
- `frontend/src/components/molecules/Library/Library.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/components/molecules/Downloader/Downloader.tsx`
- `frontend/src/app/[locale]/albums/AlbumsClient.tsx`
- `frontend/src/components/atoms/ui/card.tsx`
- `frontend/src/app/[locale]/HomePageClient.tsx`
- `frontend/src/components/google-drive/DrivePicker.tsx`
- `frontend/src/lib/supabase.ts`
- `frontend/src/app/[locale]/music/page.tsx`
- `frontend/src/components/molecules/AddToPlaylist/AddToPlaylistDialog.tsx`
- `frontend/src/components/molecules/Navigation/BottomTabBar.tsx`
- `frontend/src/components/molecules/Player/Player.tsx`

## Backend API Surface

The backend graph indexes route nodes for the older core API:

- `GET /`
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

Source cross-checking shows additional or newer routes that are not fully represented in the graph route nodes:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/google`
- `GET /auth/users`
- `GET /auth/me`
- `GET /google-drive/auth-url`
- `POST /google-drive/exchange-code`
- `POST /messages`
- `GET /messages/:userId`
- `POST /friend-requests/invite`
- `GET /friend-requests/info/:token`
- `POST /friend-requests/accept/:token`

Treat the route nodes as useful but stale for auth, messaging, and newer Google Drive OAuth work.

## Frontend Data Flow

`frontend/src/lib/api.ts` is the main HTTP boundary. It wraps `fetch`, attaches auth headers, and exposes helpers for:

- Auth: register, Google login, email/password login, and `/auth/me`.
- Albums: create/list/detail.
- Songs: list, YouTube import, move, delete.
- Google Drive: OAuth URL, code exchange, file listing, and import.

Important frontend entry points:

- `frontend/src/store/useAuthStore.ts`: auth token and user session state.
- `frontend/src/components/auth/AuthGate.tsx`: protected route gating.
- `frontend/src/app/[locale]/layout.tsx`: localized app shell.
- `frontend/src/app/[locale]/HomePageClient.tsx`: home/library data loading.
- `frontend/src/app/[locale]/albums/AlbumsClient.tsx`: album list and creation.
- `frontend/src/components/templates/AlbumDetailClient.tsx`: album detail and track interaction.
- `frontend/src/components/molecules/Library/Library.tsx`: library view.
- `frontend/src/components/molecules/Downloader/Downloader.tsx`: YouTube import UI.
- `frontend/src/components/google-drive/DrivePicker.tsx`: Google Drive selection/import UI.

## Known Index Errors

Root graph error log:

- `frontend/src/components/UpdaterInit.tsx` could not be read because the file no longer exists.

Frontend graph error log:

- `src/components/UpdaterInit.tsx` could not be read because the file no longer exists.
- `src/middleware.ts` could not be read because the file no longer exists.

These errors mean the graphs were generated before some frontend files were removed or moved. Rebuild the affected graph before relying on exact frontend coverage.

## Practical Query Examples

The local `sqlite3` CLI is not installed in this environment, but Python's standard `sqlite3` module works:

```bash
rtk proxy python3 - <<'PY'
import sqlite3

con = sqlite3.connect(".codegraph/codegraph.db")
for row in con.execute("""
    select kind, name, file_path, start_line
    from nodes
    where name like '%Album%'
    order by file_path, start_line
    limit 50
"""):
    print(row)
con.close()
PY
```

Find indexed backend routes:

```bash
rtk proxy python3 - <<'PY'
import sqlite3

con = sqlite3.connect("backend/.codegraph/codegraph.db")
for row in con.execute("""
    select name, file_path, start_line
    from nodes
    where kind = 'route'
    order by file_path, start_line
"""):
    print(row)
con.close()
PY
```

Find high-density frontend files:

```bash
rtk proxy python3 - <<'PY'
import sqlite3

con = sqlite3.connect("frontend/.codegraph/codegraph.db")
for row in con.execute("""
    select path, node_count
    from files
    order by node_count desc, path
    limit 20
"""):
    print(row)
con.close()
PY
```

## Recommended Reading Order

For backend behavior:

1. `backend/src/main.ts`
2. `backend/src/app.module.ts`
3. `backend/src/auth/auth.controller.ts`
4. `backend/src/auth/auth.service.ts`
5. `backend/src/albums/album.controller.ts`
6. `backend/src/albums/album.service.ts`
7. `backend/src/songs/song.controller.ts`
8. `backend/src/songs/song.service.ts`
9. `backend/src/google-drive/google-drive.controller.ts`
10. `backend/src/google-drive/google-drive.service.ts`

For frontend behavior:

1. `frontend/src/lib/api.ts`
2. `frontend/src/store/useAuthStore.ts`
3. `frontend/src/components/auth/AuthGate.tsx`
4. `frontend/src/app/[locale]/layout.tsx`
5. `frontend/src/app/[locale]/HomePageClient.tsx`
6. `frontend/src/app/[locale]/albums/AlbumsClient.tsx`
7. `frontend/src/components/templates/AlbumDetailClient.tsx`
8. `frontend/src/components/molecules/Library/Library.tsx`
9. `frontend/src/components/molecules/Downloader/Downloader.tsx`
10. `frontend/src/components/google-drive/DrivePicker.tsx`
