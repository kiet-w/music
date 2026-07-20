# Backend Auth and Ownership Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix and create tests for the backend after the Auth and Ownership implementation to ensure security and functional correctness.

**Architecture:** Unit tests for services and E2E tests for controllers. Services will be tested with mocked repositories and dependent services. E2E tests will use a mocked PrismaService to simulate DB operations and test authentication flows.

**Tech Stack:** NestJS, Jest, Supertest, Prisma, BullMQ.

---

### Task A: Fix SongService Unit Tests

**Files:**
- Modify: `src/songs/song.service.spec.ts`

- [ ] **Step 1: Update mocks and providers**
Add `AlbumService` mock and inject it into `TestingBuilder`.

- [ ] **Step 2: Update createFromYoutube tests**
Include `userId` in all `createFromYoutube` calls. Mock `AlbumService.findOrCreateDefault` instead of manually finding/creating default album.

- [ ] **Step 3: Update findAll and findOne tests**
Include `userId` in calls. Mock `songRepository.findMany` and `songRepository.findFirst` with correct `where` clauses including `userId`.

- [ ] **Step 4: Update remove and moveToAlbum tests**
Include `userId` in calls. Mock `songRepository.findFirst` to verify ownership before deletion or update.

- [ ] **Step 5: Run tests and verify**
Run: `rtk proxy npx jest src/songs/song.service.spec.ts`
Expected: PASS

### Task B: Create AlbumService Unit Tests

**Files:**
- Create: `src/albums/album.service.spec.ts`

- [ ] **Step 1: Setup test module**
Mock `AlbumRepository` and `PinoLogger`.

- [ ] **Step 2: Test create**
Verify `albumRepository.create` is called with correct data and `userId`.

- [ ] **Step 3: Test findOrCreateDefault**
Test success path and race condition path (catch error and try find again).

- [ ] **Step 4: Test findAll and findOne**
Verify `userId` filtering and song count mapping.

- [ ] **Step 5: Run tests and verify**
Run: `rtk proxy npx jest src/albums/album.service.spec.ts`
Expected: PASS

### Task C: Create Auth E2E Tests

**Files:**
- Create: `test/auth.e2e-spec.ts`

- [ ] **Step 1: Setup E2E test module**
Mock `PrismaService` and `JwtAuthGuard` (if needed, but AuthController usually needs real JwtService).

- [ ] **Step 2: Test POST /auth/register**
Success case and conflict (duplicate email) case.

- [ ] **Step 3: Test POST /auth/login**
Success case and unauthorized case.

- [ ] **Step 4: Test GET /auth/me**
Verify access with JWT token.

- [ ] **Step 5: Run tests and verify**
Run: `rtk proxy npx jest test/auth.e2e-spec.ts`
Expected: PASS

### Task D: Update Existing E2E Tests

**Files:**
- Modify: `test/albums.e2e-spec.ts`
- Modify: `test/songs.e2e-spec.ts`

- [ ] **Step 1: Update E2E setup to bypass or mock Auth**
Since we are mocking `PrismaService`, we can also mock `JwtAuthGuard` to simplify things, or provide a dummy token and mock the `JwtService`.

- [ ] **Step 2: Update Albums E2E expectations**
Update `PrismaService` mocks to expect `userId` in `where` clauses.

- [ ] **Step 3: Update Songs E2E expectations**
Update `PrismaService` mocks to expect `userId` in `where` clauses and include `album: { userId }` for song lookups.

- [ ] **Step 4: Run all tests and verify**
Run: `rtk proxy npx jest test/albums.e2e-spec.ts test/songs.e2e-spec.ts`
Expected: PASS

### Task E: Final Verification

- [ ] **Step 1: Run all backend tests**
Run: `rtk proxy npm run test` and `rtk proxy npm run test:e2e`
Expected: ALL PASS
