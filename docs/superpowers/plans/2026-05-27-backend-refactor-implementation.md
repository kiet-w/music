# Backend Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the backend to use DTOs, Repository pattern, and isolated infrastructure helpers for better maintainability and parallel development.

**Architecture:** Domain-Driven Design with 4 layers: Transport (DTOs), Domain (Services), Persistence (Repositories), and Infrastructure (Isolated Helpers).

**Tech Stack:** NestJS, Prisma, BullMQ, class-validator, class-transformer.

---

### Task 0: Dependencies & Environment

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: Install validation dependencies**

Run: `rtk npm install class-validator class-transformer`

- [ ] **Step 2: Commit**

```bash
git add backend/package.json
git commit -m "feat: add validation dependencies"
```

---

### Task 1: Infrastructure & Core Setup (Agent 1)

**Files:**
- Modify: `backend/src/main.ts`
- Create: `backend/src/common/interfaces/storage-provider.interface.ts`
- Create: `backend/src/common/interfaces/downloader-provider.interface.ts`
- Modify: `backend/src/storage/storage.service.ts`
- Modify: `backend/src/downloader/downloader.service.ts`

- [ ] **Step 1: Setup Global Validation Pipe**

Modify `backend/src/main.ts` to include `ValidationPipe` with `transform: true`.

- [ ] **Step 2: Define Infrastructure Interfaces**

Create `IStorageProvider` and `IDownloaderProvider` interfaces in `src/common/interfaces`.

- [ ] **Step 3: Refactor StorageService**

Implement `IStorageProvider` in `StorageService`. Add better error handling and logging.

- [ ] **Step 4: Refactor DownloaderService**

Implement `IDownloaderProvider` in `DownloaderService`. Ensure temporary file cleanup is handled correctly (or provide a cleanup method).

- [ ] **Step 5: Commit**

```bash
git add backend/src/main.ts backend/src/common/interfaces backend/src/storage/storage.service.ts backend/src/downloader/downloader.service.ts
git commit -m "refactor: setup core infrastructure and interfaces"
```

---

### Task 2: Persistence Layer Foundation (Agent 2)

**Files:**
- Create: `backend/src/common/repositories/base.repository.ts`
- Create: `backend/src/songs/repositories/song.repository.ts`
- Create: `backend/src/albums/repositories/album.repository.ts`
- Modify: `backend/src/songs/songs.module.ts`
- Modify: `backend/src/albums/albums.module.ts`

- [ ] **Step 1: Implement BaseRepository**

Create an abstract `BaseRepository` that wraps Prisma's common operations.

- [ ] **Step 2: Implement SongRepository**

Create `SongRepository` extending `BaseRepository`. Include methods for `findAll` (with include), `findOne`, and `create`.

- [ ] **Step 3: Implement AlbumRepository**

Create `AlbumRepository` extending `BaseRepository`. Include methods for finding albums by title/artist.

- [ ] **Step 4: Update Modules**

Register repositories in their respective modules.

- [ ] **Step 5: Commit**

```bash
git add backend/src/common/repositories backend/src/songs/repositories backend/src/albums/repositories backend/src/songs/songs.module.ts backend/src/albums/albums.module.ts
git commit -m "feat: implement repository layer"
```

---

### Task 3: Songs Module Refactor (Agent 3)

**Files:**
- Create: `backend/src/songs/dto/create-song-youtube.dto.ts`
- Create: `backend/src/songs/dto/song-response.dto.ts`
- Modify: `backend/src/songs/song.controller.ts`
- Modify: `backend/src/songs/song.service.ts`

- [ ] **Step 1: Create DTOs**

Implement `CreateSongYoutubeDto` with validation decorators and `SongResponseDto` for output.

- [ ] **Step 2: Update SongService**

Refactor `SongService` to use `SongRepository` instead of direct `PrismaService`. Use the repository for all CRUD.

- [ ] **Step 3: Update SongController**

Use `CreateSongYoutubeDto` in `createFromYoutube` and ensure `SongResponseDto` is returned.

- [ ] **Step 4: Commit**

```bash
git add backend/src/songs/dto backend/src/songs/song.controller.ts backend/src/songs/song.service.ts
git commit -m "refactor: songs module with DTOs and Repositories"
```

---

### Task 4: Albums Module Refactor (Agent 4)

**Files:**
- Create: `backend/src/albums/dto/album-response.dto.ts`
- Modify: `backend/src/albums/album.controller.ts`
- Modify: `backend/src/albums/album.service.ts`

- [ ] **Step 1: Create Album DTOs**

Implement `AlbumResponseDto` and any necessary input DTOs.

- [ ] **Step 2: Update AlbumService**

Refactor `AlbumService` to use `AlbumRepository`.

- [ ] **Step 3: Update AlbumController**

Update types and ensure DTO usage.

- [ ] **Step 4: Commit**

```bash
git add backend/src/albums/dto backend/src/albums/album.controller.ts backend/src/albums/album.service.ts
git commit -m "refactor: albums module with DTOs and Repositories"
```

---

### Task 5: Admin Module & Management (Agent 5)

**Files:**
- Create: `backend/src/admin/admin.controller.ts`
- Create: `backend/src/admin/admin.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Create AdminController**

Implement endpoints for administrative tasks: delete track, storage cleanup, etc.

- [ ] **Step 2: Setup AdminModule**

Register `AdminController` and import necessary modules.

- [ ] **Step 3: Register in AppModule**

Import `AdminModule` into `AppModule`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/admin backend/src/app.module.ts
git commit -m "feat: add admin module for management"
```
