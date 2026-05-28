# Setup E2E Test Infrastructure & Songs Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the E2E testing foundation for the backend and implement E2E tests for the Songs module to ensure correct controller-service integration with infrastructure mocks.

**Architecture:** Use NestJS `@nestjs/testing` for application bootstrapping, overriding real infrastructure providers (Prisma, BullMQ) with mocks to isolate controller logic during E2E tests.

**Tech Stack:** NestJS, Jest, Supertest, Prisma, BullMQ.

---

### Task 1: Verify and Update E2E Jest Configuration

**Files:**
- Modify: `backend/test/jest-e2e.json`

- [ ] **Step 1: Check `backend/test/jest-e2e.json` content**
Run: `cat backend/test/jest-e2e.json`
Expected: Already has `testTimeout: 30000`. No module mapping needed as per current `tsconfig.json`.

- [ ] **Step 2: Commit (if changes made, else skip)**
```bash
rtk proxy git add backend/test/jest-e2e.json
rtk proxy git commit -m "test(e2e): update jest-e2e configuration"
```

### Task 2: Implement Songs E2E Tests

**Files:**
- Create: `backend/test/songs.e2e-spec.ts`

- [ ] **Step 1: Write the failing E2E test for Songs**
I'll start by creating the test file with the structure provided in the task.

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
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

- [ ] **Step 2: Run E2E tests**
Run: `cd backend && npm run test:e2e`
Expected: PASS for `songs.e2e-spec.ts`.

- [ ] **Step 3: Verify results and fix any issues**
If any failures occur due to mismatch in DTOs or service logic, adjust the test or implementation as needed.

- [ ] **Step 4: Commit**
```bash
rtk proxy git add backend/test/songs.e2e-spec.ts
rtk proxy git commit -m "test(e2e): add songs module e2e tests"
```
