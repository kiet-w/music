# Backend E2E Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement comprehensive E2E tests for the backend Songs, Albums, and Admin modules using mocked external dependencies.

**Architecture:** Use NestJS `Test` utilities with `supertest`. External services (Prisma, BullMQ, Storage, Downloader) will be mocked to ensure tests are fast and deterministic.

**Tech Stack:** NestJS Testing, Jest, supertest, ts-jest.

---

### Task 1: Setup E2E Test Infrastructure & Songs Tests

**Files:**
- Create: `backend/test/songs.e2e-spec.ts`
- Modify: `backend/test/jest-e2e.json`

- [ ] **Step 1: Update jest-e2e.json to support module mapping**

Ensure `@/` or paths are resolved correctly if used (none currently used in backend). Add `testTimeout`.

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "testTimeout": 30000
}
```

- [ ] **Step 2: Write failing E2E test for Songs**

Create `backend/test/songs.e2e-spec.ts` with mocks for Prisma, BullMQ, and Cache.

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';

describe('SongsController (e2e)', () => {
  let app: INestApplication;
  
  const mockPrismaService = {
    track: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    album: {
      findMany: jest.fn(),
      create: jest.fn(),
    }
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(getQueueToken('conversion'))
      .useValue(mockQueue)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/songs (GET) - should return all songs', async () => {
    const mockSongs = [{ id: '1', title: 'Song 1', artist: 'Artist 1', url: 'http://link.com' }];
    mockPrismaService.track.findMany.mockResolvedValue(mockSongs);

    return request(app.getHttpServer())
      .get('/songs')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
        expect(res.body[0].title).toBe('Song 1');
      });
  });

  it('/songs/youtube (POST) - should create a conversion job', async () => {
    const songData = { url: 'https://youtube.com/watch?v=123', title: 'New Song', artist: 'New Artist' };
    const mockAlbum = { id: 'album-1', title: 'Default' };
    const mockSong = { id: 'song-1', ...songData, albumId: 'album-1', sourceType: 'youtube' };

    mockPrismaService.album.findMany.mockResolvedValue([mockAlbum]);
    mockPrismaService.track.create.mockResolvedValue(mockSong);
    mockQueue.add.mockResolvedValue({ id: 'job-1' });

    return request(app.getHttpServer())
      .post('/songs/youtube')
      .send(songData)
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBe('song-1');
        expect(mockQueue.add).toHaveBeenCalled();
      });
  });
});
```

- [ ] **Step 3: Run E2E tests**

Run: `cd backend && npm run test:e2e`
Expected: PASS for `songs.e2e-spec.ts`.

- [ ] **Step 4: Commit**

```bash
rtk proxy git add backend/test/songs.e2e-spec.ts backend/test/jest-e2e.json
rtk proxy git commit -m "test(e2e): add songs module e2e tests"
```

---

### Task 2: Albums E2E Tests

**Files:**
- Create: `backend/test/albums.e2e-spec.ts`

- [ ] **Step 1: Write E2E tests for Albums**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AlbumsController (e2e)', () => {
  let app: INestApplication;
  
  const mockPrismaService = {
    album: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    }
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/albums (GET) - should return all albums', async () => {
    const mockAlbums = [{ id: '1', title: 'Album 1', artist: 'Artist 1' }];
    mockPrismaService.album.findMany.mockResolvedValue(mockAlbums);

    return request(app.getHttpServer())
      .get('/albums')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
        expect(res.body[0].title).toBe('Album 1');
      });
  });

  it('/albums/:id (GET) - should return one album', async () => {
    const mockAlbum = { id: '1', title: 'Album 1', tracks: [] };
    mockPrismaService.album.findUnique.mockResolvedValue(mockAlbum);

    return request(app.getHttpServer())
      .get('/albums/1')
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe('1');
      });
  });
});
```

- [ ] **Step 2: Run E2E tests**

Run: `cd backend && npm run test:e2e`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
rtk proxy git add backend/test/albums.e2e-spec.ts
rtk proxy git commit -m "test(e2e): add albums module e2e tests"
```

---

### Task 3: Admin E2E Tests

**Files:**
- Create: `backend/test/admin.e2e-spec.ts`

- [ ] **Step 1: Write E2E tests for Admin**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { IStorageProvider } from '../src/common/interfaces/storage-provider.interface';

describe('AdminController (e2e)', () => {
  let app: INestApplication;
  
  const mockPrismaService = {
    track: {
      delete: jest.fn(),
    }
  };

  const mockStorageProvider = {
    delete: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider('IStorageProvider')
      .useValue(mockStorageProvider)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/admin/tracks/:id (DELETE) - should delete a track', async () => {
    mockPrismaService.track.delete.mockResolvedValue({ id: '1' });

    return request(app.getHttpServer())
      .delete('/admin/tracks/1')
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe('1');
      });
  });

  it('/admin/storage/cleanup (POST) - should initiate cleanup', async () => {
    mockStorageProvider.delete.mockResolvedValue(undefined);

    return request(app.getHttpServer())
      .post('/admin/storage/cleanup')
      .send({ bucketName: 'music', path: 'songs/1.mp3' })
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toContain('cleanup initiated');
        expect(mockStorageProvider.delete).toHaveBeenCalledWith('music', 'songs/1.mp3');
      });
  });
});
```

- [ ] **Step 2: Run all E2E tests**

Run: `cd backend && npm run test:e2e`
Expected: All E2E tests pass.

- [ ] **Step 3: Commit**

```bash
rtk proxy git add backend/test/admin.e2e-spec.ts
rtk proxy git commit -m "test(e2e): add admin module e2e tests"
```
