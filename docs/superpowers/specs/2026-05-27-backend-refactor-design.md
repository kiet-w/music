# Backend Refactor Design Spec (Domain-Driven Approach)

**Date:** 2026-05-27
**Status:** Approved
**Topic:** Backend Refactoring for Maintainability and Parallel Development

## 1. Goal
Refactor the NestJS backend to implement a clean, domain-driven architecture. This will improve code reviewability, maintainability, and allow for parallel development by multiple subagents. Key focus areas include DTOs, a Repository layer, and isolation of infrastructure helpers.

## 2. Architecture Overview
The system will follow a 4-layer architecture:
1.  **Transport Layer:** Controllers using `class-validator` DTOs for input validation and `class-transformer` for output mapping.
2.  **Domain Layer:** Services containing business logic, isolated from persistence details.
3.  **Persistence Layer:** Repositories wrapping Prisma, implementing a `BaseRepository` pattern.
4.  **Infrastructure/Helper Layer:** Isolated providers for YouTube downloading (`yt-dlp`) and Storage (Supabase), using interfaces.

## 3. Component Details

### 3.1 DTO Layer
- Every POST/PUT endpoint must have a corresponding `Create/Update` DTO.
- Every GET endpoint should return a `Response` DTO to prevent leaking internal database structures.
- Use `class-validator` for runtime validation.

### 3.2 Repository Layer
- `BaseRepository<T>`: Abstract class providing standard CRUD operations (`findMany`, `findOne`, `create`, `update`, `delete`).
- `SongRepository`: Extends `BaseRepository`, adds music-specific queries (e.g., search by artist).
- `AlbumRepository`: Extends `BaseRepository`, handles album/track relationships.

### 3.3 Infrastructure Helpers
- `DownloaderService`: Strict interface for `yt-dlp` execution, including proper file cleanup and error handling.
- `StorageService`: Generic storage interface to decouple the application from Supabase-specific logic.
- `Internal Helpers`: Modules will have an `internal/` or `private/` folder for logic that shouldn't be exposed to the rest of the app.

### 3.4 Admin Module
- New `AdminModule` for management tasks.
- Endpoints for track deletion, storage cleanup, and manual conversion triggers.

## 4. Subagent Task Breakdown (Parallel Execution)
The work is split into 5 independent tasks:

| Subagent | Task | Scope |
| :--- | :--- | :--- |
| **Agent 1** | Core & Infrastructure | Setup Global Pipes, Filters, and Refactor Downloader/Storage Helpers. |
| **Agent 2** | Persistence Foundation | Implement `BaseRepository` and migrate all Prisma calls to `SongRepository` and `AlbumRepository`. |
| **Agent 3** | Songs Domain | Implement Songs DTOs and refactor `SongService` to use `SongRepository`. |
| **Agent 4** | Albums Domain | Implement Albums DTOs and refactor `AlbumService` to use `AlbumRepository`. |
| **Agent 5** | Admin Module | Create `AdminController` and isolate private helper logic for management. |

## 5. Success Criteria
- No direct Prisma calls in Services.
- 100% of endpoints covered by DTOs.
- All tests (existing and new) pass.
- Clean separation of concerns verified by code review.
