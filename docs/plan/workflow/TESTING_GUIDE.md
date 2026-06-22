# Testing Guide — Test Cases, Mocking Strategy & Template

## 1. Tổng Quan Testing

### Test Pyramid Hiện Tại

```
          /\
         /E2E\      ← Chưa có
        /──────\
       / Integr \   ← Chưa có (known gap)
      /──────────\
     /  Unit Tests \ ← CÓ — mock repositories
    /──────────────\
```

**Lý do chỉ có Unit Tests**: Feedback loop nhanh, chạy trong vài giây trên CI. Trade-off: không catch bugs trong Prisma query logic phức tạp (cần Integration Tests sau).

### Chạy Tests

```bash
cd backend

# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# Specific file
npx jest src/songs/song.service.spec.ts

# Specific pattern
npx jest --testPathPattern="album"
```

---

## 2. Mocking Strategy

### Tại Sao Mock ở Repository Layer (Không Phải Prisma Trực Tiếp)?

```typescript
// ❌ Mock Prisma trực tiếp — brittle, tightly coupled
const mockPrisma = {
  track: {
    findFirst: jest.fn(),
    create: jest.fn(),
  }
};

// ✅ Mock Repository — đúng boundary
const mockSongRepository = {
  findFirst: jest.fn(),
  create: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};
```

**Lý do**:
1. Service chỉ biết đến `SongRepository` interface — không biết Prisma tồn tại
2. Nếu sau này đổi Prisma → TypeORM: chỉ sửa Repository, Service không bị ảnh hưởng
3. Mock Prisma chained methods (`prisma.track.findFirst().then()`) rất phức tạp và brittle

### Jest Config

File: `backend/package.json` (jest section):

```json
{
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

---

## 3. Test Cases Hiện Có

### `SongService` (`src/songs/song.service.spec.ts`)

| Test Case | Mô tả | Pattern |
|-----------|-------|---------|
| `createFromYoutube - track reuse` | YouTube ID đã tồn tại trong DB → reuse URL | Happy path + dedup |
| `createFromYoutube - new track` | YouTube ID mới → tạo record + enqueue | Happy path |
| `createFromYoutube - invalid album` | albumId không thuộc về user → 404 | Authorization |
| `createFromYoutube - default album` | Không có albumId → findOrCreateDefault | Default behavior |
| `findAll - pagination` | Trả về đúng data + total + page | Pagination |
| `findOne - success` | Track tồn tại → return DTO | Happy path |
| `findOne - not found` | Track không tồn tại hoặc wrong user → 404 | Authorization |
| `remove - success` | Xóa track thành công | Happy path |
| `moveToAlbum - success` | Chuyển album thành công | Happy path |

### `AlbumService` (`src/albums/album.service.spec.ts`)

| Test Case | Mô tả | Pattern |
|-----------|-------|---------|
| `findOrCreateDefault - create` | Chưa có default album → tạo mới | Happy path |
| `findOrCreateDefault - P2002 race condition` | Unique constraint violation → fallback findFirst | **Race condition** |
| `findOrCreateDefault - other error` | Lỗi không phải P2002 → re-throw | Error propagation |
| `create - success` | Tạo album thành công | Happy path |
| `findAll - pagination` | Trả đúng format | Pagination |
| `findOne - not found` | Sai userId → 404 | Authorization |

### `ConversionProcessor` (`src/jobs/conversion.processor.spec.ts`)

| Test Case | Mô tả | Pattern |
|-----------|-------|---------|
| `process - success` | Download → Upload → Update DB → Cleanup | Happy path |
| `process - download fail` | yt-dlp throw → cleanup temp + re-throw | Failure + cleanup |
| `process - upload fail` | Upload throw → cleanup temp + re-throw | Failure + cleanup |
| `process - cleanup always runs` | Success hoặc fail đều cleanup | Finally block |

### `CorsFailClosed` (`src/cors-fail-closed.spec.ts`)

| Test Case | Mô tả |
|-----------|-------|
| `missing CORS_ORIGINS` | App throw error khi không có biến |
| `empty CORS_ORIGINS` | App throw error khi biến rỗng |

---

## 4. Template Viết Test Mới

### Template: Service Unit Test

```typescript
// src/<module>/<name>.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from './<name>.service';
import { MyRepository } from './repositories/<name>.repository';
import { getQueueToken } from '@nestjs/bullmq';
import { PinoLogger } from 'nestjs-pino';
import { NotFoundException } from '@nestjs/common';

describe('MyService', () => {
  let service: MyService;
  let mockRepository: jest.Mocked<MyRepository>;

  // ── Mock setup ────────────────────────────────────────────────────────────
  const mockMyRepository = {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyService,
        { provide: MyRepository, useValue: mockMyRepository },
        { provide: getQueueToken('conversion'), useValue: mockQueue },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<MyService>(MyService);
    mockRepository = module.get(MyRepository);

    // Reset mocks trước mỗi test
    jest.clearAllMocks();
  });

  // ── Happy path ────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return entity when found', async () => {
      // Arrange
      const mockEntity = { id: 'uuid', name: 'Test', userId: 'user-id' };
      mockMyRepository.findFirst.mockResolvedValue(mockEntity);

      // Act
      const result = await service.findOne('user-id', 'uuid');

      // Assert
      expect(mockMyRepository.findFirst).toHaveBeenCalledWith({
        where: { id: 'uuid', userId: 'user-id' },
      });
      expect(result).toMatchObject({ id: 'uuid' });
    });

    // ── Not found / Authorization ─────────────────────────────────────────
    it('should throw NotFoundException when not found', async () => {
      mockMyRepository.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-id', 'wrong-id'))
        .rejects.toThrow(NotFoundException);
    });

    // ── Edge case: wrong user ─────────────────────────────────────────────
    it('should throw NotFoundException when entity belongs to different user', async () => {
      mockMyRepository.findFirst.mockResolvedValue(null); // findFirst filters by userId

      await expect(service.findOne('other-user', 'uuid'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── Race condition ────────────────────────────────────────────────────────
  describe('findOrCreate', () => {
    it('should fallback to findFirst on P2002 (race condition)', async () => {
      // Arrange: simulate unique constraint violation
      const { ConflictException } = await import('@nestjs/common');
      mockMyRepository.create.mockRejectedValue(new ConflictException());
      const existing = { id: 'existing-id', userId: 'user-id' };
      mockMyRepository.findFirst.mockResolvedValue(existing);

      // Act
      const result = await service.findOrCreate('user-id');

      // Assert
      expect(mockMyRepository.create).toHaveBeenCalledTimes(1);
      expect(mockMyRepository.findFirst).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('existing-id');
    });
  });
});
```

---

### Template: Factory Pattern cho Test Data

```typescript
// src/test/factories/user.factory.ts
export const UserFactory = {
  build: (overrides: Partial<any> = {}): any => ({
    id: 'test-user-id',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: 'USER',
    name: 'Test User',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    googleId: null,
    googleAccessToken: null,
    googleRefreshToken: null,
    googleTokenExpiry: null,
    ...overrides,
  }),
};

export const TrackFactory = {
  build: (overrides: Partial<any> = {}): any => ({
    id: 'test-track-id',
    title: 'Test Song',
    artist: 'Test Artist',
    url: 'https://supabase.co/music/test.mp3',
    duration: 213,
    albumId: 'test-album-id',
    userId: 'test-user-id',
    sourceType: 'youtube',
    sourceId: 'dQw4w9WgXcQ',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  }),
};

export const AlbumFactory = {
  build: (overrides: Partial<any> = {}): any => ({
    id: 'test-album-id',
    title: 'Default Album',
    artist: null,
    coverUrl: null,
    isDefault: true,
    userId: 'test-user-id',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  }),
};

// Usage trong test:
// const user = UserFactory.build({ role: 'ADMIN' });
// const track = TrackFactory.build({ url: '' }); // Track đang processing
```

---

## 5. Test Coverage Targets

| Module | Current | Target |
|--------|---------|--------|
| `SongService` | ~80% | 90% |
| `AlbumService` | ~85% | 90% |
| `AuthService` | ~70% | 85% |
| `ConversionProcessor` | ~75% | 85% |
| `GoogleDriveService` | ~50% | 75% |
| `MessagesService` | ~60% | 80% |
| Repository layer | 0% | 0% (unit) → Integration tests |

> **⚠️ Coverage bao nhiêu không quan trọng bằng cover đúng behavior**:
> - Test race condition (P2002 fallback)
> - Test cleanup-in-finally (temp file không leak)
> - Test authorization (user A không xem được data user B)
> - Test validation edge cases (URL format, empty strings)

---

## 6. Integration Tests Roadmap (Chưa Implement)

Cần thêm sau:

```typescript
// Dùng @testcontainers/postgresql
import { PostgreSqlContainer } from '@testcontainers/postgresql';

describe('SongRepository Integration', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaClient;

  beforeAll(async () => {
    container = await new PostgreSqlContainer().start();
    prisma = new PrismaClient({
      datasources: { db: { url: container.getConnectionUri() } }
    });
    await prisma.$executeRaw`...apply migrations...`;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await container.stop();
  });

  it('findFirst returns null for wrong userId', async () => {
    // Test thật với DB thật
  });
});
```

**Tại sao cần**: Mock repository không kiểm tra được query logic thực tế (WHERE clause sai, index không được dùng, N+1 queries).