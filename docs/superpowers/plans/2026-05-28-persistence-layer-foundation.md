# Persistence Layer Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a reusable repository layer for the music application to abstract Prisma logic and provide a consistent interface for data access.

**Architecture:** We will use an abstract `BaseRepository<T>` that wraps common Prisma delegate operations. Entity-specific repositories (`SongRepository`, `AlbumRepository`) will extend this base class and add specific queries as needed. This maintains a clean separation between business logic in services and data access in repositories.

**Tech Stack:** NestJS, Prisma, TypeScript.

---

### Task 1: Base Repository Infrastructure

**Files:**
- Create: `backend/src/common/repositories/base.repository.ts`

- [ ] **Step 1: Define the BaseRepository abstract class**
Implement CRUD operations (`findMany`, `findUnique`, `create`, `update`, `delete`) using a generic Prisma delegate.

```typescript
import { PrismaService } from '../../prisma/prisma.service';

export abstract class BaseRepository<T, Delegate> {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly delegate: Delegate,
  ) {}

  async findMany(args?: any): Promise<T[]> {
    return (this.delegate as any).findMany(args);
  }

  async findUnique(args: any): Promise<T | null> {
    return (this.delegate as any).findUnique(args);
  }

  async create(args: any): Promise<T> {
    return (this.delegate as any).create(args);
  }

  async update(args: any): Promise<T> {
    return (this.delegate as any).update(args);
  }

  async delete(args: any): Promise<T> {
    return (this.delegate as any).delete(args);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/common/repositories/base.repository.ts
git commit -m "feat: add abstract BaseRepository"
```

### Task 2: Song Repository Implementation

**Files:**
- Create: `backend/src/songs/repositories/song.repository.ts`
- Modify: `backend/src/songs/songs.module.ts`

- [ ] **Step 1: Implement SongRepository**
Extend `BaseRepository` and pass the `prisma.track` delegate.

```typescript
import { Injectable } from '@nestjs/common';
import { Prisma, Track } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';

@Injectable()
export class SongRepository extends BaseRepository<
  Track,
  Prisma.TrackDelegate<any>
> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.track);
  }
}
```

- [ ] **Step 2: Register SongRepository in SongsModule**

```typescript
import { Module } from '@nestjs/common';
import { SongController } from './song.controller';
import { SongService } from './song.service';
import { JobsModule } from '../jobs/jobs.module';
import { SongRepository } from './repositories/song.repository';

@Module({
  imports: [JobsModule],
  controllers: [SongController],
  providers: [SongService, SongRepository],
  exports: [SongRepository],
})
export class SongsModule {}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/songs/repositories/song.repository.ts backend/src/songs/songs.module.ts
git commit -m "feat: implement SongRepository"
```

### Task 3: Album Repository Implementation

**Files:**
- Create: `backend/src/albums/repositories/album.repository.ts`
- Modify: `backend/src/albums/albums.module.ts`

- [ ] **Step 1: Implement AlbumRepository**
Extend `BaseRepository`, pass `prisma.album` delegate, and add `findByTitleAndArtist`.

```typescript
import { Injectable } from '@nestjs/common';
import { Album, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';

@Injectable()
export class AlbumRepository extends BaseRepository<
  Album,
  Prisma.AlbumDelegate<any>
> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.album);
  }

  async findByTitleAndArtist(title: string, artist: string): Promise<Album | null> {
    return this.prisma.album.findFirst({
      where: {
        title,
        artist,
      },
    });
  }
}
```

- [ ] **Step 2: Register AlbumRepository in AlbumsModule**

```typescript
import { Module } from '@nestjs/common';
import { AlbumController } from './album.controller';
import { AlbumService } from './album.service';
import { AlbumRepository } from './repositories/album.repository';

@Module({
  controllers: [AlbumController],
  providers: [AlbumService, AlbumRepository],
  exports: [AlbumRepository],
})
export class AlbumsModule {}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/albums/repositories/album.repository.ts backend/src/albums/albums.module.ts
git commit -m "feat: implement AlbumRepository with findByTitleAndArtist"
```

### Task 4: Verification

- [ ] **Step 1: Verify compilation**
Run the build command to ensure no TypeScript errors.

Run: `cd backend && npm run build`
Expected: Successful build without errors.
