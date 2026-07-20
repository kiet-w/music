# Queries Documentation

## Overview
Queries represent read operations in the CQRS pattern. Each query encapsulates a specific data retrieval request. Queries are executed via the QueryBus and handled by dedicated QueryHandlers.

## Directory Structure
```
backend/src/songs/queries/
├── find-all-songs/
│   ├── find-all-songs.query.ts
│   └── find-all-songs.handler.ts
└── find-one-song/
    ├── find-one-song.query.ts
    └── find-one-song.handler.ts
```

---

## FindAllSongsQuery

### Query Definition
**File**: `queries/find-all-songs/find-all-songs.query.ts`

```typescript
import { IQuery } from '@nestjs/cqrs';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FindAllSongsQuery implements IQuery {
  constructor(
    public readonly userId: string,
    public readonly paginationDto: PaginationDto,
  ) {}
}
```

**Purpose**: Encapsulate parameters for retrieving paginated song list

**Properties:**
- `userId` - ID of the user requesting songs
- `paginationDto` - Pagination parameters `{ page, limit, sort, albumId }`

---

### Query Handler
**File**: `queries/find-all-songs/find-all-songs.handler.ts`

```typescript
@QueryHandler(FindAllSongsQuery)
export class FindAllSongsHandler implements IQueryHandler<FindAllSongsQuery> {
  constructor(
    private readonly songRepository: SongRepository,
    private readonly songMapper: SongMapper,
    @InjectPinoLogger(FindAllSongsHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(query: FindAllSongsQuery): Promise<{
    data: SongResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>
}
```

**Dependencies:**
- `SongRepository` - Database operations
- `SongMapper` - Entity to DTO conversion
- `logger` - Pino logger for structured logging

---

### Execution Flow

```typescript
async execute(query: FindAllSongsQuery): Promise<PaginatedResponse> {
  const { userId, paginationDto } = query;

  // 1. Parse pagination parameters
  const page = paginationDto.page || 1;
  const limit = paginationDto.limit || 10;
  const skip = (page - 1) * limit;
  const take = limit;

  // 2. Build sort order
  let orderBy: any = { createdAt: 'desc' };
  if (paginationDto.sort) {
    orderBy = { [paginationDto.sort]: 'asc' };
  }

  // 3. Build where clause
  const where: any = { userId };
  if (paginationDto.albumId) {
    where.albumId = paginationDto.albumId;
  }

  // 4. Execute parallel queries (count + data)
  const [total, songs] = await Promise.all([
    this.songRepository.count({ where }),
    this.songRepository.findAllByUser(userId, skip, take, orderBy, where),
  ]);

  // 5. Map to DTOs
  return {
    data: this.songMapper.mapToResponseArray(songs),
    total,
    page,
    limit: take,
    totalPages: Math.ceil(total / take),
  };
}
```

---

### Pagination Logic

**Parameters:**
- `page` - Current page number (default: 1)
- `limit` - Items per page (default: 10)
- `skip` - Number of items to skip: `(page - 1) * limit`
- `take` - Number of items to fetch: `limit`

**Example:**
```
page = 2, limit = 10
skip = (2 - 1) * 10 = 10
take = 10
Result: Items 11-20
```

---

### Sorting

**Default Sort:**
```typescript
orderBy: { createdAt: 'desc' }
```
- Newest songs first

**Custom Sort:**
```typescript
if (paginationDto.sort) {
  orderBy: { [paginationDto.sort]: 'asc' }
}
```
- Sort by any field in ascending order
- Example: `?sort=title` sorts by title A-Z

---

### Filtering

**Album Filter:**
```typescript
if (paginationDto.albumId) {
  where.albumId = paginationDto.albumId;
}
```
- Filter songs by album ID
- Example: `?albumId=abc123`

---

### Parallel Queries

**Why parallel?**
```typescript
const [total, songs] = await Promise.all([
  this.songRepository.count({ where }),
  this.songRepository.findAllByUser(userId, skip, take, orderBy, where),
]);
```

**Benefits:**
- Faster response time
- Count and data fetch are independent
- Reduces total query time

**Sequential (Slower):**
```typescript
const total = await this.songRepository.count({ where });
const songs = await this.songRepository.findAllByUser(...);
// Total time = countTime + dataTime
```

**Parallel (Faster):**
```typescript
const [total, songs] = await Promise.all([...]);
// Total time = max(countTime, dataTime)
```

---

### Response Format

```typescript
{
  data: SongResponseDto[],  // Array of songs
  total: number,            // Total number of songs
  page: number,             // Current page
  limit: number,            // Items per page
  totalPages: number        // Total pages
}
```

**Example:**
```json
{
  "data": [
    {
      "id": "song1",
      "title": "Song A",
      "artist": "Artist A",
      "url": "https://...",
      "albumId": "album1",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

---

## FindOneSongQuery

### Query Definition
**File**: `queries/find-one-song/find-one-song.query.ts`

```typescript
import { IQuery } from '@nestjs/cqrs';

export class FindOneSongQuery implements IQuery {
  constructor(
    public readonly userId: string,
    public readonly id: string,
  ) {}
}
```

**Purpose**: Encapsulate parameters for retrieving a single song

**Properties:**
- `userId` - ID of the user requesting the song
- `id` - ID of the song to retrieve

---

### Query Handler
**File**: `queries/find-one-song/find-one-song.handler.ts`

```typescript
@QueryHandler(FindOneSongQuery)
export class FindOneSongHandler implements IQueryHandler<FindOneSongQuery> {
  constructor(
    private readonly songRepository: SongRepository,
    private readonly songMapper: SongMapper,
    @InjectPinoLogger(FindOneSongHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(query: FindOneSongQuery): Promise<SongResponseDto>
}
```

---

### Execution Flow

```typescript
async execute(query: FindOneSongQuery): Promise<SongResponseDto> {
  const { userId, id } = query;

  // 1. Find song with ownership check
  const song = await this.songRepository.findByUserAndId(userId, id);
  
  // 2. Throw if not found
  if (!song) {
    throw new NotFoundException('Song not found');
  }

  // 3. Map to DTO
  return this.songMapper.mapToResponse(song);
}
```

**Ownership Check:**
- Repository ensures song belongs to user
- Prevents unauthorized access
- Returns 404 if song doesn't exist OR user doesn't own it

---

## Query Pattern Benefits

### 1. Separation from Commands
- Queries only read data
- Commands only write data
- Clear separation of concerns

### 2. Optimization Opportunities
- Can optimize queries independently
- Can use read replicas
- Can cache query results

### 3. Testability
Each query can be tested independently:
```typescript
describe('FindAllSongsHandler', () => {
  it('should return paginated songs', async () => {
    // Mock repository
    // Execute handler
    // Verify pagination logic
  });
});
```

### 4. Reusability
Same query can be used from multiple contexts:
- HTTP endpoint
- GraphQL resolver
- WebSocket handler
- Background job

---

## Performance Considerations

### Database Indexes
Ensure proper indexes for query performance:
```prisma
model Track {
  id        String   @id @default(cuid())
  userId    String
  albumId   String?
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([userId, albumId])
  @@index([sourceType, sourceId])
}
```

### N+1 Problem
Avoid N+1 queries by using `include`:
```typescript
// Bad (N+1)
const songs = await repository.findMany({ where: { userId } });
for (const song of songs) {
  song.album = await albumRepository.findUnique({ where: { id: song.albumId } });
}

// Good (eager loading)
const songs = await repository.findMany({ 
  where: { userId },
  include: { album: true }
});
```

### Pagination Limits
Enforce maximum limit to prevent large queries:
```typescript
const limit = Math.min(paginationDto.limit || 10, 100);
```

---

## Error Handling

### Common Errors

**NotFoundException**
- Song not found
- User doesn't own the song

**BadRequestException**
- Invalid pagination parameters
- Invalid ID format

---

## Related Documentation

- [Commands Documentation](./03-commands.md) - Write operations
- [Repository Documentation](./05-repository.md) - Data access
- [DTOs Documentation](./07-dto.md) - Response format

---

**Previous**: [Commands Documentation](./03-commands.md)  
**Next**: [Repository Documentation](./05-repository.md)
