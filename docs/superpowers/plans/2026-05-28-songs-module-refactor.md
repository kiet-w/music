# Songs Module Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Songs module to use repositories and DTOs, improving validation and separation of concerns.

**Architecture:** Use `SongRepository` and `AlbumRepository` for data access. Implement `CreateSongYoutubeDto` for input validation and `SongResponseDto` for consistent API responses.

**Tech Stack:** NestJS, Prisma, class-validator, class-transformer.

---

### Task 1: Create DTOs

**Files:**
- Create: `backend/src/songs/dto/create-song-youtube.dto.ts`
- Create: `backend/src/songs/dto/song-response.dto.ts`

- [ ] **Step 1: Create CreateSongYoutubeDto**

```typescript
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateSongYoutubeDto {
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  artist?: string;
}
```

- [ ] **Step 2: Create SongResponseDto**

```typescript
import { Expose } from 'class-transformer';

export class SongResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  artist: string;

  @Expose()
  url: string;

  @Expose()
  albumId: string;

  @Expose()
  sourceType: string;
}
```

- [ ] **Step 3: Commit DTOs**

```bash
rtk proxy git add backend/src/songs/dto/
rtk proxy git commit -m "feat(songs): add DTOs for create and response"
```

### Task 2: Update SongsModule dependencies

**Files:**
- Modify: `backend/src/songs/songs.module.ts`

- [ ] **Step 1: Import AlbumsModule in SongsModule**

```typescript
import { Module } from '@nestjs/common';
import { SongController } from './song.controller';
import { SongService } from './song.service';
import { JobsModule } from '../jobs/jobs.module';
import { SongRepository } from './repositories/song.repository';
import { AlbumsModule } from '../albums/albums.module';

@Module({
  imports: [JobsModule, AlbumsModule],
  controllers: [SongController],
  providers: [SongService, SongRepository],
  exports: [SongRepository],
})
export class SongsModule {}
```

- [ ] **Step 2: Commit module change**

```bash
rtk proxy git add backend/src/songs/songs.module.ts
rtk proxy git commit -m "refactor(songs): import AlbumsModule"
```

### Task 3: Refactor SongService

**Files:**
- Modify: `backend/src/songs/song.service.ts`

- [ ] **Step 1: Update constructor and methods to use repositories**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SongRepository } from './repositories/song.repository';
import { AlbumRepository } from '../albums/repositories/album.repository';

@Injectable()
export class SongService {
  constructor(
    private songRepository: SongRepository,
    private albumRepository: AlbumRepository,
    @InjectQueue('conversion') private conversionQueue: Queue,
  ) {}

  async createFromYoutube(url: string, title: string, artist?: string) {
    let album = await this.albumRepository.findMany({
      where: { title: 'Default' },
      take: 1,
    }).then(albums => albums[0]);

    if (!album) {
      album = await this.albumRepository.create({
        data: { title: 'Default', artist: 'Various Artists' },
      });
    }

    const song = await this.songRepository.create({
      data: {
        title,
        artist,
        url: '', 
        albumId: album.id,
        sourceType: 'youtube',
      },
    });

    await this.conversionQueue.add('convert', {
      url,
      songId: song.id,
    });

    return song;
  }

  async findAll() {
    return this.songRepository.findMany({
      include: { album: true },
    });
  }

  async findOne(id: string) {
    return this.songRepository.findUnique({
      where: { id },
      include: { album: true },
    });
  }
}
```

- [ ] **Step 2: Commit service refactor**

```bash
rtk proxy git add backend/src/songs/song.service.ts
rtk proxy git commit -m "refactor(songs): use repositories in SongService"
```

### Task 4: Refactor SongController

**Files:**
- Modify: `backend/src/songs/song.controller.ts`

- [ ] **Step 1: Use DTOs and return typed responses**

```typescript
import { Controller, Post, Body, Get, Param, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { SongService } from './song.service';
import { CreateSongYoutubeDto } from './dto/create-song-youtube.dto';
import { SongResponseDto } from './dto/song-response.dto';
import { plainToInstance } from 'class-transformer';

@Controller('songs')
@UseInterceptors(ClassSerializerInterceptor)
export class SongController {
  constructor(private readonly songService: SongService) {}

  @Post('youtube')
  async createFromYoutube(@Body() createSongDto: CreateSongYoutubeDto): Promise<SongResponseDto> {
    const song = await this.songService.createFromYoutube(
      createSongDto.url,
      createSongDto.title,
      createSongDto.artist,
    );
    return plainToInstance(SongResponseDto, song, { excludeExtraneousValues: true });
  }

  @Get()
  async findAll(): Promise<SongResponseDto[]> {
    const songs = await this.songService.findAll();
    return plainToInstance(SongResponseDto, songs, { excludeExtraneousValues: true });
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SongResponseDto> {
    const song = await this.songService.findOne(id);
    return plainToInstance(SongResponseDto, song, { excludeExtraneousValues: true });
  }
}
```

- [ ] **Step 2: Commit controller refactor**

```bash
rtk proxy git add backend/src/songs/song.controller.ts
rtk proxy git commit -m "refactor(songs): use DTOs in SongController"
```

### Task 5: Verification

- [ ] **Step 1: Build the backend**

Run: `cd backend && npm run build`
Expected: Successful build without errors.

- [ ] **Step 2: Run tests**

Run: `cd backend && npm run test`
Expected: All tests pass.

- [ ] **Step 3: Commit final changes**

```bash
rtk proxy git commit -m "refactor: songs module refactor complete"
```
