# Albums Module Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Albums module to use a repository pattern and DTOs for consistent API responses.

**Architecture:** Inject `AlbumRepository` into `AlbumService` to abstract data access. Use `AlbumResponseDto` in `AlbumController` with NestJS `ClassSerializerInterceptor` to control the output format.

**Tech Stack:** NestJS, Prisma, class-transformer, class-validator.

---

### Task 1: Create Album Response DTO

**Files:**
- Create: `backend/src/albums/dto/album-response.dto.ts`

- [ ] **Step 1: Create AlbumResponseDto**

```typescript
import { Expose, Type } from 'class-transformer';
import { SongResponseDto } from '../../songs/dto/song-response.dto';

export class AlbumResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  artist: string;

  @Expose()
  coverUrl: string;

  @Expose()
  @Type(() => SongResponseDto)
  tracks?: SongResponseDto[];
}
```

- [ ] **Step 2: Commit**

```bash
rtk proxy git add backend/src/albums/dto/album-response.dto.ts
rtk proxy git commit -m "feat(albums): add AlbumResponseDto"
```

### Task 2: Refactor AlbumService

**Files:**
- Modify: `backend/src/albums/album.service.ts`

- [ ] **Step 1: Update AlbumService to use AlbumRepository**

```typescript
import { Injectable } from '@nestjs/common';
import { AlbumRepository } from './repositories/album.repository';

@Injectable()
export class AlbumService {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async create(data: { title: string; artist?: string; coverUrl?: string }) {
    return this.albumRepository.create({ data });
  }

  async findAll() {
    return this.albumRepository.findMany({
      include: { tracks: true },
    });
  }

  async findOne(id: string) {
    return this.albumRepository.findUnique({
      where: { id },
      include: { tracks: true },
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
rtk proxy git add backend/src/albums/album.service.ts
rtk proxy git commit -m "refactor(albums): use AlbumRepository in AlbumService"
```

### Task 3: Update AlbumController

**Files:**
- Modify: `backend/src/albums/album.controller.ts`

- [ ] **Step 1: Update AlbumController to use DTOs and Interceptor**

```typescript
import { Controller, Get, Post, Body, Param, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { AlbumService } from './album.service';
import { AlbumResponseDto } from './dto/album-response.dto';
import { plainToInstance } from 'class-transformer';

@Controller('albums')
@UseInterceptors(ClassSerializerInterceptor)
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  @Post()
  async create(@Body() body: { title: string; artist?: string; coverUrl?: string }): Promise<AlbumResponseDto> {
    const album = await this.albumService.create(body);
    return plainToInstance(AlbumResponseDto, album);
  }

  @Get()
  async findAll(): Promise<AlbumResponseDto[]> {
    const albums = await this.albumService.findAll();
    return plainToInstance(AlbumResponseDto, albums);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<AlbumResponseDto> {
    const album = await this.albumService.findOne(id);
    return plainToInstance(AlbumResponseDto, album);
  }
}
```

- [ ] **Step 2: Commit**

```bash
rtk proxy git add backend/src/albums/album.controller.ts
rtk proxy git commit -m "refactor(albums): use AlbumResponseDto in AlbumController"
```

### Task 4: Verification

- [ ] **Step 1: Run build**

Run: `cd backend && npm run build`
Expected: SUCCESS

- [ ] **Step 2: Run tests**

Run: `cd backend && npm run test`
Expected: PASS

- [ ] **Step 3: Final Commit**

```bash
rtk proxy git commit -m "refactor: albums module with DTOs and Repositories"
```
