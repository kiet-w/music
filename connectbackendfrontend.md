# Connect Backend + Frontend Plan: Private User Library V1

> This root plan tracks the contracts and integration behavior between backend and frontend. Backend-specific tasks live in `backend/docs/backendplan.md`; frontend-specific tasks live in `frontend/docs/frontendplan.md`.

## Task 1: Lock API Base URL

**Files**
- `frontend/src/lib/api.ts`
- `backend/src/main.ts`
- `backend/.env`

- [ ] Decide backend dev port.
- [ ] If backend runs on `3002`, set `PORT=3002`.
- [ ] Frontend uses `NEXT_PUBLIC_API_URL ?? 'http://localhost:3002'`.
- [ ] Confirm frontend can call backend `/auth/me`.

**Acceptance**
- Frontend and backend agree on one local API URL.

## Task 2: Lock CORS Contract

**File**
- `backend/src/main.ts`

- [ ] Ensure `Authorization` header is allowed.
- [ ] Keep JSON request support.
- [ ] Confirm browser preflight succeeds after login.

**Acceptance**
- Authenticated frontend requests are not blocked by CORS.

## Task 3: Lock Auth Response Contract

**Backend**
- `POST /auth/register`
- `POST /auth/login`

**Frontend**
- `register`
- `login`
- `useAuthStore.setSession`

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

- [ ] Frontend `AuthResponse` matches exactly.
- [ ] Frontend stores exactly `{ accessToken, user }`.

**Acceptance**
- No field mapping mismatch between backend and frontend auth.

## Task 4: Lock `/auth/me` Contract

**Backend**
- `GET /auth/me`

**Frontend**
- `fetchMe`
- `useAuthStore.hydrate`

- [ ] Frontend sends:

```http
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

- [ ] Frontend keeps session only when `/auth/me` succeeds.
- [ ] Frontend clears memory store and removes `music.auth` when `/auth/me` fails.

**Acceptance**
- Invalid or expired localStorage token cannot keep user logged in.

## Task 5: Lock Protected Request Rule

**Protected API routes**
- `GET /albums`
- `POST /albums`
- `GET /albums/:id`
- `GET /songs`
- `GET /songs/:id`
- `POST /songs/youtube`
- `DELETE /songs/:id`
- `PATCH /songs/:id/move`

- [ ] Every protected frontend call sends `Authorization`.
- [ ] Missing token returns `401`.
- [ ] Malformed token returns `401`.
- [ ] Valid token reaches controller.

**Acceptance**
- No protected album/song request works anonymously.

## Task 6: Lock Ownership Rule

**Backend rule**
- `Album.userId` is the source of ownership.
- `Track` ownership is derived through `Track.album.userId`.

**Frontend rule**
- Frontend never sends `userId`.

- [ ] Album create uses current user from JWT.
- [ ] Album list filters by current user.
- [ ] Song list filters by `album.userId`.
- [ ] Track mutations verify ownership through album relation.

**Acceptance**
- User A and User B cannot see or mutate each other's resources.

## Task 7: Lock Album API Contract

- [ ] Frontend create album body is only:

```json
{
  "title": "Album title",
  "artist": "Artist name",
  "coverUrl": "optional"
}
```

- [ ] Backend ignores/rejects any `userId` from body.
- [ ] Backend writes `userId` from JWT.
- [ ] Backend returns album response shape currently expected by UI.

**Acceptance**
- Album ownership cannot be spoofed from frontend.

## Task 8: Lock Default Album Contract

- [ ] Frontend may omit `albumId` when converting song.
- [ ] Backend creates/uses current user's default album.
- [ ] Default album is found by `isDefault: true`.
- [ ] PostgreSQL partial unique index ensures one default album per user.

**Acceptance**
- Convert without album always lands in current user's default album.

## Task 9: Lock Convert Song Contract

- [ ] Frontend sends selected `albumId` if user chose an album.
- [ ] Backend verifies album belongs to current user.
- [ ] Foreign `albumId` returns `404`.
- [ ] Backend creates track only after album ownership passes.

**Acceptance**
- Forged album IDs cannot write tracks into another user's albums.

## Task 10: Lock Move/Delete Track Contract

- [ ] Backend verifies source track belongs to current user.
- [ ] Backend verifies target album belongs to current user for move.
- [ ] Foreign track or album returns `404`.
- [ ] Frontend handles `404` by refreshing or showing not-found.

**Acceptance**
- Cross-user track operations are impossible.

## Task 11: Lock Error Handling Contract

- [ ] `401` means unauthenticated or invalid token.
- [ ] `409` means duplicate register email.
- [ ] `404` means missing or foreign resource.
- [ ] Frontend clears `music.auth` on protected `401`.
- [ ] Frontend shows duplicate email message on register `409`.
- [ ] Frontend does not expose whether a foreign resource exists.

**Acceptance**
- Frontend and backend handle auth/ownership errors consistently.

## Task 12: Lock Server Component Boundary

- [ ] Server Components do not call protected album/song APIs.
- [ ] Client Components fetch after `isHydrated && accessToken`.
- [ ] AuthGate controls protected routes.

**Acceptance**
- Refreshing pages does not trigger unauthenticated server-side protected fetches.

## Task 13: Lock Google Drive V1 Scope

- [ ] Google Drive is not part of private library v1.
- [ ] Frontend hides Drive entry points.
- [ ] Backend Drive routes are not required for v1 acceptance.
- [ ] Integration tests do not depend on Drive.

**Acceptance**
- Out-of-scope Drive code cannot block login/register/album/song flow.

## Task 14: User A/B Isolation Scenario

- [ ] Register user A.
- [ ] User A creates album.
- [ ] User A converts one song into that album.
- [ ] Logout.
- [ ] Register user B.
- [ ] User B cannot see user A album.
- [ ] User B cannot see user A track.
- [ ] User B direct API request for user A album returns `404`.

**Acceptance**
- Private library isolation works end-to-end.

## Task 15: Token Hydration Scenario

- [ ] Login successfully.
- [ ] Refresh page with valid `music.auth`.
- [ ] Frontend calls `/auth/me`.
- [ ] App remains logged in.
- [ ] Replace localStorage token with invalid value.
- [ ] Refresh page.
- [ ] Frontend clears `music.auth`.
- [ ] App redirects to login.

**Acceptance**
- No invalid-token refresh loop.

## Task 16: Convert Song Scenario

- [ ] Convert song with selected owned album.
- [ ] Track appears in selected album.
- [ ] Convert song without album.
- [ ] Track appears in user's default album.
- [ ] Try convert with another user's `albumId`.
- [ ] Backend returns `404`.
- [ ] No track is created for foreign album attempt.

**Acceptance**
- Convert flow respects ownership in all paths.

## Task 17: Full Verification

Backend:

```bash
cd backend
npm test -- --runInBand
npm run test:e2e
npm run build
```

Frontend:

```bash
cd frontend
npm run build
```

- [ ] Backend tests pass.
- [ ] Backend build passes.
- [ ] Frontend build passes.
- [ ] Manual user A/B smoke test passes.

**Acceptance**
- The backend/frontend private library v1 is ready for implementation review.
