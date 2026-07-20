# Backend Plan: Private User Library V1

> Track progress by ticking each checkbox. Scope: login/register, private albums, convert songs into the current user's albums. Google Drive is out of scope for this v1 plan.

## Task 1: Audit Backend Current State

**Files to inspect**
- `backend/prisma/schema.prisma`
- `backend/src/app.module.ts`
- `backend/src/auth/*`
- `backend/src/albums/*`
- `backend/src/songs/*`

- [ ] Confirm Prisma datasource is PostgreSQL.
- [ ] Confirm whether `User` already exists.
- [ ] Confirm whether `Album.userId` already exists.
- [ ] Confirm whether auth module, guard, and decorator already exist.
- [ ] Confirm whether album/song controllers already use `JwtAuthGuard`.
- [ ] Record any existing code that already satisfies later tasks.

**Acceptance**
- Implementer knows exactly which tasks are new work and which are already partly done.

## Task 2: Install/Confirm Auth Dependencies

**Files**
- `backend/package.json`
- `backend/package-lock.json`

- [ ] Ensure `@nestjs/jwt` is installed.
- [ ] Ensure `bcryptjs` is installed.
- [ ] If missing, run:

```bash
cd backend
npm install @nestjs/jwt bcryptjs
```

**Acceptance**
- Backend can import `JwtModule`, `JwtService`, and `bcryptjs`.

## Task 3: Define JWT Environment Contract

**Files**
- `backend/.env`
- Optional: `backend/README.md`

- [ ] Add `JWT_SECRET`.
- [ ] Add `JWT_EXPIRES_IN=7d`.
- [ ] Ensure production/deploy env will use a long random `JWT_SECRET`.
- [ ] Document that missing `JWT_EXPIRES_IN` defaults to `7d`.

**Acceptance**
- Backend JWT signing and verifying use env config, not hard-coded secrets.

## Task 4: Update Prisma User Model

**File**
- `backend/prisma/schema.prisma`

- [ ] Ensure `User` has `id`, `email`, `passwordHash`, optional `name`, timestamps, and `albums`.

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  albums       Album[]
}
```

**Acceptance**
- Users can authenticate and own albums.

## Task 5: Update Prisma Album Model

**File**
- `backend/prisma/schema.prisma`

- [ ] Add `userId`.
- [ ] Add `isDefault Boolean @default(false)`.
- [ ] Add cascade relation to `User`.
- [ ] Add indexes for `userId` and default lookup.
- [ ] Remove `@@unique([userId, title])` so users can create duplicate album titles.

Target shape:

```prisma
model Album {
  id        String   @id @default(uuid())
  title     String
  artist    String?
  coverUrl  String?
  isDefault Boolean  @default(false)
  userId    String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tracks    Track[]

  @@index([userId])
  @@index([userId, isDefault])
}
```

**Acceptance**
- Albums are private to one user.
- Default album is represented by `isDefault`, not by title only.

## Task 6: Keep Prisma Track Normalized

**File**
- `backend/prisma/schema.prisma`

- [ ] Do not add `Track.userId`.
- [ ] Ensure `Track.album` cascades when album is deleted.
- [ ] Keep `@@index([albumId])`.

Target shape:

```prisma
model Track {
  id         String   @id @default(uuid())
  title      String
  artist     String?
  url        String
  duration   Int?
  albumId    String
  sourceType String?
  sourceId   String?
  createdAt  DateTime @default(now())
  album      Album    @relation(fields: [albumId], references: [id], onDelete: Cascade)

  @@index([albumId])
}
```

**Acceptance**
- Track ownership is always derived from `track.album.userId`.

## Task 7: Create Prisma Migration

**Files**
- `backend/prisma/migrations/*/migration.sql`
- `backend/prisma/schema.prisma`

- [ ] Run `npx prisma format`.
- [ ] Run migration:

```bash
cd backend
npx prisma migrate dev --name private_user_library_v1
```

- [ ] Add PostgreSQL partial unique index in the generated migration:

```sql
CREATE UNIQUE INDEX "Album_one_default_per_user"
ON "Album"("userId")
WHERE "isDefault" = true;
```

- [ ] Run `npx prisma generate`.

**Acceptance**
- PostgreSQL enforces only one default album per user.

## Task 8: Handle Existing Data Migration

**Files**
- `backend/prisma/migrations/*/migration.sql`

- [ ] If dev data can be discarded, reset DB before migration.
- [ ] If data must be preserved, create one fallback user in SQL.
- [ ] Backfill existing albums with fallback `userId`.
- [ ] Only after backfill, make `Album.userId` required.

**Acceptance**
- Migration does not fail on existing albums.

## Task 9: Implement Auth DTOs

**Files**
- `backend/src/auth/dto/register.dto.ts`
- `backend/src/auth/dto/login.dto.ts`
- `backend/src/auth/dto/auth-response.dto.ts`

- [ ] `RegisterDto.email` uses `@IsEmail()`.
- [ ] `RegisterDto.password` uses `@MinLength(8)`.
- [ ] `RegisterDto.name` is optional.
- [ ] `LoginDto.email` uses `@IsEmail()`.
- [ ] `LoginDto.password` is required.
- [ ] Auth response excludes `passwordHash`.

**Acceptance**
- Invalid auth payloads fail through global `ValidationPipe`.

## Task 10: Implement Auth Service

**Files**
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/repositories/user.repository.ts`

- [ ] Register lowercases email.
- [ ] Register rejects duplicate email with `ConflictException`.
- [ ] Register hashes password with `bcryptjs.hash(password, 12)`.
- [ ] Login lowercases email.
- [ ] Login rejects missing user or wrong password with `UnauthorizedException`.
- [ ] Auth response includes `accessToken` and safe user object.
- [ ] `/me` returns current safe user or `UnauthorizedException`.

**Acceptance**
- Backend never returns `passwordHash`.

## Task 11: Implement Auth Controller and Module

**Files**
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.module.ts`
- `backend/src/app.module.ts`

- [ ] Add `POST /auth/register`.
- [ ] Add `POST /auth/login`.
- [ ] Add `GET /auth/me`.
- [ ] Register `AuthModule` in `AppModule`.
- [ ] Configure JWT secret and expiry from env.

**Acceptance**
- Auth API contract is available to frontend.

## Task 12: Implement JWT Guard

**Files**
- `backend/src/auth/jwt-auth.guard.ts`

- [ ] Require `Authorization: Bearer <token>`.
- [ ] Verify token using `JwtService`.
- [ ] Attach `{ id: payload.sub, email: payload.email }` to request.
- [ ] Return `401` for missing, malformed, invalid, or expired token.
- [ ] Do not parse token manually in album/song services.

**Acceptance**
- Controllers can trust `request.user` after guard passes.

## Task 13: Implement Current User Decorator

**Files**
- `backend/src/auth/current-user.decorator.ts`

- [ ] Return `request.user`.
- [ ] Use type shape `{ id: string; email: string }`.

**Acceptance**
- Controllers can use `@CurrentUser() user`.

## Task 14: Protect Album Routes

**Files**
- `backend/src/albums/album.controller.ts`
- `backend/src/albums/album.service.ts`
- `backend/src/albums/repositories/album.repository.ts`

- [ ] Add `@UseGuards(JwtAuthGuard)` to album controller or individual routes.
- [ ] `POST /albums` uses `currentUser.id`.
- [ ] `GET /albums` filters `where: { userId: currentUser.id }`.
- [ ] `GET /albums/:id` filters by both `id` and `userId`.
- [ ] Foreign album IDs return `404`.
- [ ] Ignore any `userId` sent in request body.

**Acceptance**
- User only sees and creates their own albums.

## Task 15: Implement Default Album Helper

**Files**
- `backend/src/albums/album.service.ts`
- `backend/src/albums/repositories/album.repository.ts`

- [ ] Add `findOrCreateDefaultAlbum(userId: string)`.
- [ ] Query by `{ userId, isDefault: true }`.
- [ ] Create `{ title: 'Default', artist: 'Various Artists', isDefault: true, userId }` when missing.
- [ ] On unique conflict, re-query and return existing default album.

**Acceptance**
- Each user gets at most one default album.

## Task 16: Protect Song Routes

**Files**
- `backend/src/songs/song.controller.ts`
- `backend/src/songs/song.service.ts`
- `backend/src/songs/repositories/song.repository.ts`

- [ ] Add `@UseGuards(JwtAuthGuard)` to song controller or individual routes.
- [ ] `GET /songs` filters `where: { album: { userId: currentUser.id } }`.
- [ ] `GET /songs/:id` verifies ownership through album relation.
- [ ] `DELETE /songs/:id` verifies ownership before delete.
- [ ] Foreign track IDs return `404`.

**Acceptance**
- User cannot read/delete another user's tracks.

## Task 17: Fix Convert Song Ownership

**Files**
- `backend/src/songs/song.service.ts`
- `backend/src/songs/song.controller.ts`

- [ ] `POST /songs/youtube` receives current user from guard.
- [ ] If `albumId` is provided, verify album belongs to current user.
- [ ] If `albumId` is missing, use `findOrCreateDefaultAlbum(currentUser.id)`.
- [ ] If album belongs to another user, return `404`.
- [ ] Create track under verified album only.

**Acceptance**
- Forged `albumId` cannot create tracks in another user's album.

## Task 18: Fix Move Track Ownership

**Files**
- `backend/src/songs/song.service.ts`
- `backend/src/songs/song.controller.ts`

- [ ] Verify source track belongs to current user.
- [ ] Verify target album belongs to current user.
- [ ] Move by updating `albumId` only.
- [ ] Return `404` if source track or target album is foreign.

**Acceptance**
- Cross-user track moves are impossible.

## Task 19: Keep Google Drive Out of Backend V1

**Files**
- `backend/src/google-drive/google-drive.controller.ts`
- `backend/src/app.module.ts`

- [ ] Decide whether to leave existing Google Drive routes unused or guard/disable them.
- [ ] Ensure current v1 album/song auth work does not depend on Google Drive.
- [ ] If routes stay enabled, do not include them in private-library acceptance tests.

**Acceptance**
- Google Drive does not block or define v1 private library behavior.

## Task 20: Backend Unit Tests

**Files**
- `backend/src/auth/*.spec.ts`
- `backend/src/albums/*.spec.ts`
- `backend/src/songs/*.spec.ts`

- [ ] Test register success.
- [ ] Test duplicate email returns conflict.
- [ ] Test login invalid password returns unauthorized.
- [ ] Test JWT guard rejects missing/invalid token.
- [ ] Test album create uses current user.
- [ ] Test album list filters by user.
- [ ] Test default album helper creates one default per user.
- [ ] Test song convert rejects foreign `albumId`.
- [ ] Test move rejects foreign track or album.

**Acceptance**
- Unit tests cover ownership bugs before implementation is considered done.

## Task 21: Backend E2E Tests

**Files**
- `backend/test/auth.e2e-spec.ts`
- `backend/test/albums.e2e-spec.ts`
- `backend/test/songs.e2e-spec.ts`

- [ ] Register user A and B.
- [ ] User A creates album.
- [ ] User B cannot list/read user A album.
- [ ] User A converts into own album.
- [ ] User A converting into user B album returns `404`.
- [ ] User B cannot get/delete/move user A track.
- [ ] Missing JWT returns `401`.

**Acceptance**
- Full HTTP flow enforces private library rules.

## Task 22: Backend Verification

- [ ] Run:

```bash
cd backend
npm test -- --runInBand
```

- [ ] Run:

```bash
cd backend
npm run test:e2e
```

- [ ] Run:

```bash
cd backend
npm run build
```

**Acceptance**
- Unit tests, e2e tests, and build pass.
