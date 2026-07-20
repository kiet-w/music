# Backend + Frontend Connection Implementation Plan

> **For tracking:** This file covers tasks that only make sense when backend and frontend are wired together. Complete these after or alongside `backend/docs/backendplan.md` and `frontend/docs/frontendplan.md`.

**Goal:** Lock the shared API contracts, token flow, ownership behavior, and end-to-end checks between the NestJS backend and NextJS frontend.

**Architecture:** Backend issues and verifies app JWT. Frontend stores the JWT, verifies it with `/auth/me`, and sends it to all protected backend routes. Google Drive uses a separate short-lived Google access token in addition to the app JWT.

---

## Task 1: Confirm Shared Base URL Contract

**Files:**
- Frontend: `frontend/src/lib/api.ts`
- Backend: `backend/src/main.ts`

- [ ] Confirm frontend API base URL points to backend.

Current value:

```ts
const RAW_API_URL = 'http://localhost:3002';
```

- [ ] Confirm backend listens on expected port.

Backend currently uses:

```ts
const port = process.env.PORT ?? 3000;
```

- [ ] Decide local dev value.

Required outcome:
- If backend runs on `3002`, set `PORT=3002`.
- If backend runs on `3000`, update frontend `RAW_API_URL`.

- [ ] Document final local dev values in `.env` or README.

Acceptance:
- Frontend can call `GET /auth/me` on the actual backend port.

---

## Task 2: Confirm CORS Supports Auth Headers

**Files:**
- Backend: `backend/src/main.ts`

- [ ] Confirm CORS allows `Authorization`.

Current config:

```ts
allowedHeaders: '*'
```

- [ ] Keep credentials behavior as-is unless moving to cookies.

Current config:

```ts
credentials: true
```

- [ ] Test preflight from frontend to backend after auth routes exist.

Manual check:
- Open frontend.
- Login.
- Confirm browser does not block request due to CORS.

Acceptance:
- Requests with `Authorization: Bearer <jwt>` reach backend.

---

## Task 3: Lock Auth Request and Response Shapes

**Backend Files:**
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/dto/register.dto.ts`
- `backend/src/auth/dto/login.dto.ts`
- `backend/src/auth/dto/auth-response.dto.ts`

**Frontend Files:**
- `frontend/src/lib/api.ts`
- `frontend/src/store/useAuthStore.ts`

- [ ] Backend `POST /auth/register` accepts:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

- [ ] Backend `POST /auth/login` accepts:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

- [ ] Backend returns:

```json
{
  "accessToken": "jwt",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

- [ ] Frontend `AuthResponse` matches backend response exactly.

- [ ] Frontend stores the same response shape in `localStorage`.

Acceptance:
- Login/register pages do not transform backend fields except storing them.

---

## Task 4: Lock `/auth/me` Hydration Contract

**Backend Files:**
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/jwt-auth.guard.ts`

**Frontend Files:**
- `frontend/src/lib/api.ts`
- `frontend/src/store/useAuthStore.ts`
- `frontend/src/components/auth/AuthGate.tsx`

- [ ] Backend accepts:

```http
GET /auth/me
Authorization: Bearer <appJwt>
```

- [ ] Backend returns:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name"
}
```

- [ ] Frontend hydrate flow calls `/auth/me` before trusting localStorage.

- [ ] If `/auth/me` succeeds, frontend keeps token and stores fresh user.

- [ ] If `/auth/me` fails, frontend removes `music.auth`.

Acceptance:
- Expired or edited localStorage token cannot keep the user logged in.

---

## Task 5: Lock Authorization Header Behavior

**Backend Files:**
- `backend/src/auth/jwt-auth.guard.ts`
- Protected controllers under `backend/src/albums`, `backend/src/songs`, `backend/src/google-drive`

**Frontend Files:**
- `frontend/src/lib/api.ts`

- [ ] Backend guard accepts only:

```http
Authorization: Bearer <jwt>
```

- [ ] Frontend helper always formats:

```ts
Authorization: `Bearer ${appToken}`
```

- [ ] Frontend sends the header to all protected routes.

Protected routes:
- `GET /albums`
- `POST /albums`
- `GET /albums/:id`
- `GET /songs`
- `GET /songs/:id`
- `POST /songs/youtube`
- `DELETE /songs/:id`
- `PATCH /songs/:id/move`
- `GET /google-drive/files`
- `POST /google-drive/import`

Acceptance:
- Missing JWT returns `401`.
- Malformed header returns `401`.
- Valid JWT reaches controller handler.

---

## Task 6: Lock Album API Contract

**Backend Files:**
- `backend/src/albums/album.controller.ts`
- `backend/src/albums/album.service.ts`

**Frontend Files:**
- `frontend/src/lib/api.ts`
- `frontend/src/app/[locale]/HomePageClient.tsx`
- `frontend/src/app/[locale]/albums/AlbumsClient.tsx`

- [ ] Frontend calls:

```http
GET /albums
Authorization: Bearer <appJwt>
```

- [ ] Backend returns only current user's albums.

- [ ] Frontend calls create album with:

```http
POST /albums
Authorization: Bearer <appJwt>
Content-Type: application/json
```

```json
{
  "title": "Album title",
  "artist": "Artist name",
  "coverUrl": "https://example.com/cover.jpg"
}
```

- [ ] Backend ignores any client-provided `userId`.

- [ ] Backend writes `userId` from JWT.

Acceptance:
- User A and User B can create albums with same title independently only if the final schema allows it. With `@@unique([userId, title])`, each user can have one album per title.

---

## Task 7: Lock Song API Contract

**Backend Files:**
- `backend/src/songs/song.controller.ts`
- `backend/src/songs/song.service.ts`

**Frontend Files:**
- `frontend/src/lib/api.ts`
- `frontend/src/components/molecules/Library/Library.tsx`
- `frontend/src/components/molecules/Downloader/Downloader.tsx`

- [ ] Frontend lists tracks with:

```http
GET /songs
Authorization: Bearer <appJwt>
```

- [ ] Backend returns only tracks where `track.album.userId === currentUser.id`.

- [ ] Frontend starts YouTube download with:

```http
POST /songs/youtube
Authorization: Bearer <appJwt>
Content-Type: application/json
```

```json
{
  "url": "https://youtube.com/watch?v=123",
  "title": "Song title",
  "artist": "Artist name",
  "albumId": "album-id"
}
```

- [ ] Backend validates `albumId` belongs to current user.

- [ ] If `albumId` missing, backend uses current user's Default album.

Acceptance:
- Frontend never sends or chooses `userId`.
- Backend never trusts album ownership from frontend state alone.

---

## Task 8: Lock Default Album Behavior

**Backend Files:**
- `backend/src/albums/album.service.ts`
- `backend/prisma/schema.prisma`

**Frontend Files:**
- `frontend/src/components/molecules/Downloader/Downloader.tsx`
- `frontend/src/components/google-drive/DrivePicker.tsx`

- [ ] Backend owns Default album creation.

- [ ] Frontend can omit `albumId` for YouTube.

- [ ] Frontend can omit `albumId` for Drive import only if UI permits no selection.

- [ ] Backend uses:

```ts
findOrCreateDefault(currentUser.id)
```

- [ ] Backend handles unique race through `@@unique([userId, title])`.

Acceptance:
- Two simultaneous imports for the same new user do not create duplicate Default albums.

---

## Task 9: Lock Google Drive Dual-Token Contract

**Backend Files:**
- `backend/src/google-drive/google-drive.controller.ts`
- `backend/src/google-drive/google-drive.service.ts`

**Frontend Files:**
- `frontend/src/lib/api.ts`
- `frontend/src/hooks/useGoogleDrive.ts`
- `frontend/src/components/google-drive/DrivePicker.tsx`
- `frontend/src/app/[locale]/music/page.tsx`

- [ ] App JWT identifies the app user.

- [ ] Google access token grants Drive read access.

- [ ] Frontend lists Drive files with:

```http
GET /google-drive/files?token=<googleAccessToken>
Authorization: Bearer <appJwt>
```

- [ ] Frontend imports Drive file with:

```http
POST /google-drive/import
Authorization: Bearer <appJwt>
Content-Type: application/json
```

```json
{
  "fileId": "google-file-id",
  "accessToken": "google-access-token",
  "albumId": "album-id"
}
```

- [ ] Backend validates app JWT before using Google token.

- [ ] Backend does not persist Google access token.

- [ ] Backend attaches imported track to current user's album.

Acceptance:
- User can connect Google Drive only after app login.
- Drive import cannot write into another user's album.

---

## Task 10: Lock Error Handling Contract

**Backend Files:**
- Controllers and services touched by auth implementation.
- Existing global filter: `backend/src/common/filters/http-exception.filter.ts`

**Frontend Files:**
- `frontend/src/lib/api.ts`
- Login/register pages.
- Protected client components.
- `DrivePicker`.

- [ ] Backend returns `401` for missing, malformed, expired, or invalid JWT.

- [ ] Backend returns `409` for duplicate registration email.

- [ ] Backend returns `404` for missing or foreign resources.

- [ ] Backend returns `400` for invalid DTO bodies.

- [ ] Frontend clears auth session on protected API `401`.

- [ ] Frontend shows duplicate email message on register `409`.

- [ ] Frontend shows not-found state or redirects on protected `404`.

- [ ] Frontend keeps current Drive picker error display for Google API failures.

Acceptance:
- User gets clear login/register errors.
- Unauthorized sessions are cleared consistently.

---

## Task 11: Lock Server Component Boundary

**Backend Files:**
- None.

**Frontend Files:**
- `frontend/src/app/[locale]/page.tsx`
- `frontend/src/app/[locale]/albums/page.tsx`
- `frontend/src/app/[locale]/albums/detail/page.tsx`
- Client components that fetch protected data.

- [ ] Confirm no Server Component calls protected API functions.

Search command:

```bash
cd frontend
grep -R "fetchAlbums\\|fetchTracks\\|fetchAlbum\\|downloadFromYoutube\\|importFromDrive" -n src/app
```

- [ ] For each match, confirm it is inside a client component or receives token after hydration.

- [ ] Keep protected fetches behind `isHydrated && accessToken`.

Acceptance:
- Refreshing protected pages does not create unauthenticated server-side API requests.

---

## Task 12: End-to-End Auth Smoke Test

**Backend:**
- Run backend on agreed port.

**Frontend:**
- Run frontend dev server.

- [ ] Register user A.

Expected:
- Frontend stores `music.auth`.
- Backend creates `User`.

- [ ] Refresh page.

Expected:
- Frontend calls `/auth/me`.
- Session remains active.

- [ ] Logout.

Expected:
- `music.auth` removed.
- Protected page redirects to login.

- [ ] Login user A again.

Expected:
- Session restored.

---

## Task 13: End-to-End Ownership Smoke Test

- [ ] As user A, create album `A Album`.

- [ ] As user A, add one YouTube track.

- [ ] Logout user A.

- [ ] Register user B.

- [ ] Confirm user B cannot see user A album.

- [ ] Confirm user B cannot see user A track.

- [ ] Try direct URL/API for user A album as user B.

Expected:
- Backend returns `404`.

Acceptance:
- Data isolation works from both UI and direct API.

---

## Task 14: End-to-End Google Drive Smoke Test

- [ ] Login as a valid app user.

- [ ] Click Google Drive connect.

- [ ] Complete Google consent.

- [ ] Confirm Drive files list appears.

- [ ] Select one audio file.

- [ ] Import into an album owned by current user.

- [ ] Confirm imported track appears in current user's library.

- [ ] Logout and login as a different app user.

- [ ] Confirm imported track is not visible.

Acceptance:
- Google token and app JWT are both required.
- Imported tracks are scoped by app user.

---

## Task 15: Combined Verification Commands

**Backend:**

- [ ] Run unit tests.

```bash
cd backend
npm test -- --runInBand
```

- [ ] Run e2e tests.

```bash
cd backend
npm run test:e2e
```

- [ ] Run backend build.

```bash
cd backend
npm run build
```

**Frontend:**

- [ ] Run frontend build.

```bash
cd frontend
npm run build
```

Acceptance:
- All commands pass before considering auth integration complete.

---

## Combined Completion Checklist

- [ ] Frontend and backend agree on backend base URL.
- [ ] CORS accepts `Authorization`.
- [ ] Auth response shape matches frontend types.
- [ ] `/auth/me` is used during frontend hydration.
- [ ] Protected API functions all send app JWT.
- [ ] Server Components do not fetch protected data.
- [ ] Album ownership works end-to-end.
- [ ] Song ownership works end-to-end.
- [ ] Default album behavior works end-to-end.
- [ ] Google Drive dual-token flow works end-to-end.
- [ ] Unauthorized sessions clear correctly.
- [ ] Backend tests pass.
- [ ] Frontend build passes.
