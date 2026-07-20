# Commands Documentation

## Overview
Commands represent write operations in the CQRS pattern. Each command encapsulates a specific action that changes the system state. Commands are executed via the CommandBus and handled by dedicated CommandHandlers.

## Directory Structure
```
backend/src/songs/commands/
├── create-youtube-song/
│   ├── create-youtube.song.command.ts
│   └── create-youtube.song.handler.ts
├── move-song/
│   ├── move-song-to-album.command.ts
│   └── move-song-to-album.handler.ts
└── remove-song/
    ├── remove-song.command.ts
    └── remove-song.handler.ts
```

---

## CreateSongFromYoutubeCommand

### Command Definition
**File**: `commands/create-youtube-song/create-youtube.song.command.ts`

```typescript
import { ICommand } from '@nestjs/cqrs';

export class CreateSongFromYoutubeCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly url: string,
    public readonly title: string,
    public readonly artist?: string,
    public readonly albumId?: string,
  ) {}
}
```

**Purpose**: Encapsulate data for creating a song from YouTube

**Properties:**
- `userId` - ID of the user creating the song
- `url` - YouTube URL to download from
- `title` - Song title
- `artist` - Optional artist name
- `albumId` - Optional album ID to assign song to

---

### Command Handler
**File**: `commands/create-youtube-song/create-youtube.song.handler.ts`

```typescript
@CommandHandler(CreateSongFromYoutubeCommand)
export class CreateSongFromYoutubeHandler
  implements ICommandHandler<CreateSongFromYoutubeCommand, SongResponseDto>
{
  constructor(
    private readonly songRepository: SongRepository,
    private readonly songMapper: SongMapper,
    private readonly albumHelper: AlbumValidationHelper,
    @InjectQueue('conversion') private readonly conversionQueue: Queue,
    @InjectPinoLogger(CreateSongFromYoutubeHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(command: CreateSongFromYoutubeCommand): Promise<SongResponseDto>
}
```

**Dependencies:**
- `SongRepository` - Database operations
- `SongMapper` - Entity to DTO conversion
- `AlbumValidationHelper` - Album ownership validation
- `conversionQueue` - BullMQ queue for async conversion
- `logger` - Pino logger for structured logging

---

### Execution Flow

```typescript
async execute(command: CreateSongFromYoutubeCommand): Promise<SongResponseDto> {
  const { userId, url, title, artist, albumId } = command;

  // 1. Validate Album
  const finalAlbumId = await this.albumHelper.getValidatedAlbumId(userId, albumId);

  // 2. Extract YouTube ID
  const youtubeId = this.songMapper.extractYoutubeId(url);
  if (!youtubeId) {
    throw new BadRequestException('Invalid YouTube URL');
  }

  // 3. Check for existing completed track (Level 1 deduplication)
  const existingTrack = await this.songRepository.findByYoutubeId(youtubeId);
  if (existingTrack) {
    // Reuse storage URL, create new record
    const reusedSong = await this.songRepository.create({
      data: {
        title,
        artist: artist || existingTrack.artist,
        url: existingTrack.url,
        duration: existingTrack.duration,
        albumId: finalAlbumId,
        userId,
        sourceType: SONG_SOURCE_TYPE.YOUTUBE,
        sourceId: youtubeId,
      },
    });
    return this.songMapper.mapToResponse(reusedSong);
  }

  // 4. Check for existing pending track (Level 2 deduplication)
  const pendingTrack = await this.songRepository.findPendingByYoutubeId(youtubeId);
  if (pendingTrack) {
    // Another request is converting, reuse pending record
    const reusedSong = await this.songRepository.create({
      data: {
        title,
        artist: artist || pendingTrack.artist,
        url: pendingTrack.url,
        duration: pendingTrack.duration,
        albumId: finalAlbumId,
        userId,
        sourceType: SONG_SOURCE_TYPE.YOUTUBE,
        sourceId: youtubeId,
      },
    });
    return this.songMapper.mapToResponse(reusedSong);
  }

  // 5. Create new pending record
  const song = await this.createPendingSong(userId, title, artist, finalAlbumId, youtubeId);

  // 6. Race condition guard (Level 3 deduplication)
  const raceCheck = await this.songRepository.findPendingByYoutubeId(youtubeId);
  if (raceCheck && raceCheck.id !== song.id) {
    // Another request won the race, cleanup our duplicate
    await this.songRepository.delete({ where: { id: song.id } });
    return this.songMapper.mapToResponse(raceCheck);
  }

  // 7. Enqueue conversion job
  await this.enqueueConversionJob(userId, url, song.id, youtubeId);

  return this.songMapper.mapToResponse(song);
}
```

---

### Deduplication Strategy

**Why 3-level deduplication?**

1. **Level 1: Reuse Completed Tracks**
   - Check if YouTube ID already has a converted file
   - If found, create new record pointing to same file
   - **Benefit**: No re-download, instant response

2. **Level 2: Reuse Pending Tracks**
   - Check if another request is currently converting
   - If found, create new record pointing to pending track
   - **Benefit**: Avoid duplicate conversion jobs

3. **Level 3: Race Condition Guard**
   - Double-check after creating pending record
   - If another request slipped in, cleanup duplicate
   - **Benefit**: Handle concurrent requests safely

**Flow Diagram:**
```
Request → Check Completed? → Yes → Reuse URL
           ↓ No
        Check Pending? → Yes → Reuse Pending
           ↓ No
        Create Pending → Race Check → Lost? → Cleanup & Reuse
           ↓ Won
        Enqueue Job → Return
```

---

### Job Enqueue

```typescript
private async enqueueConversionJob(
  userId: string,
  url: string,
  songId: string,
  youtubeId: string,
): Promise<void> {
  await this.conversionQueue.add(
    CONVERSION_JOB.NAME,
    { url, songId, userId },
    {
      jobId: `convert-${youtubeId}`, // Deduplication at queue level
      attempts: CONVERSION_JOB.MAX_ATTEMPTS,
      backoff: {
        type: 'exponential',
        delay: CONVERSION_JOB.BACKOFF_DELAY_MS,
      },
    },
  );
}
```

**Job ID Pattern**: `convert-{youtubeId}`
- Ensures only one job per YouTube ID
- BullMQ rejects duplicate job IDs
- Prevents duplicate downloads

**Retry Configuration:**
- `attempts: 3` - Retry up to 3 times
- `backoff: exponential` - Increase delay between retries
- `delay: 5000ms` - Initial 5 second delay

---

## RemoveSongCommand

### Command Definition
**File**: `commands/remove-song/remove-song.command.ts`

```typescript
import { ICommand } from '@nestjs/cqrs';

export class RemoveSongCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly id: string,
  ) {}
}
```

**Purpose**: Encapsulate data for deleting a song

**Properties:**
- `userId` - ID of the user deleting the song
- `id` - ID of the song to delete

---

### Command Handler
**File**: `commands/remove-song/remove-song.handler.ts`

```typescript
@CommandHandler(RemoveSongCommand)
export class RemoveSongHandler implements ICommandHandler<RemoveSongCommand, void> {
  constructor(
    private readonly songRepository: SongRepository,
    @InjectQueue('conversion') private readonly conversionQueue: Queue,
    @InjectPinoLogger(RemoveSongHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(command: RemoveSongCommand): Promise<void>
}
```

---

### Execution Flow

```typescript
async execute(command: RemoveSongCommand): Promise<void> {
  const { userId, id } = command;

  // 1. Find song with ownership check
  const song = await this.songRepository.findByUserAndId(userId, id);
  if (!song) {
    throw new NotFoundException('Song not found');
  }

  // 2. Cancel pending conversion job if applicable
  if (!song.url) {
    // Song is still pending conversion
    const pendingJobs = await this.conversionQueue.getJobs(['waiting', 'delayed']);
    const relatedJob = pendingJobs.find((job) => job.data.songId === id);
    if (relatedJob) {
      await relatedJob.remove();
    }
  }

  // 3. Delete from database
  await this.songRepository.delete({ where: { id } });
}
```

**Why cancel jobs?**
- Prevent wasted resources (downloading deleted songs)
- Keep queue clean
- Avoid orphaned temp files

**Job Cancellation Logic:**
- Only cancel if `song.url` is empty (pending)
- Scan waiting/delayed jobs (O(n) operation)
- Find job by `songId` in job data
- Remove job from queue

---

## MoveSongToAlbumCommand

### Command Definition
**File**: `commands/move-song/move-song-to-album.command.ts`

```typescript
import { ICommand } from '@nestjs/cqrs';

export class MoveSongToAlbumCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly id: string,
    public readonly albumId: string,
  ) {}
}
```

**Purpose**: Encapsulate data for moving a song to another album

**Properties:**
- `userId` - ID of the user moving the song
- `id` - ID of the song to move
- `albumId` - ID of the target album

---

### Command Handler
**File**: `commands/move-song/move-song-to-album.handler.ts`

```typescript
@CommandHandler(MoveSongToAlbumCommand)
export class MoveSongToAlbumHandler
  implements ICommandHandler<MoveSongToAlbumCommand, SongResponseDto>
{
  constructor(
    private readonly songRepository: SongRepository,
    private readonly songMapper: SongMapper,
    private readonly albumHelper: AlbumValidationHelper,
    @InjectPinoLogger(MoveSongToAlbumHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(command: MoveSongToAlbumCommand): Promise<SongResponseDto>
}
```

---

### Execution Flow

```typescript
async execute(command: MoveSongToAlbumCommand): Promise<SongResponseDto> {
  const { userId, id, albumId } = command;

  // 1. Find song with ownership check
  const song = await this.songRepository.findByUserAndId(userId, id);
  if (!song) {
    throw new NotFoundException('Song not found');
  }

  // 2. Validate target album ownership
  const validatedAlbumId = await this.albumHelper.getValidatedAlbumId(
    userId,
    albumId,
  );

  // 3. Update song's album
  const updatedSong = await this.songRepository.update({
    where: { id },
    data: { albumId: validatedAlbumId },
  });

  return this.songMapper.mapToResponse(updatedSong);
}
```

**Validation:**
- Song must belong to user
- Target album must belong to user
- Album must exist

---

## Command Pattern Benefits

### 1. Single Responsibility
Each command handler does one thing:
- `CreateSongFromYoutubeHandler` - Only creates songs
- `RemoveSongHandler` - Only deletes songs
- `MoveSongToAlbumHandler` - Only moves songs

### 2. Testability
Each handler can be tested in isolation:
```typescript
describe('CreateSongFromYoutubeHandler', () => {
  it('should reuse existing completed track', async () => {
    // Mock repository to return existing track
    // Execute handler
    // Verify reuse logic
  });
});
```

### 3. Extensibility
Easy to add new commands:
1. Create new command class
2. Create new handler class
3. Register in module
4. Add service method

### 4. Audit Trail
Commands can be logged for audit:
```typescript
this.logger.info({ userId, command }, 'Executing command');
```

---

## Error Handling

### Common Errors

**BadRequestException**
- Invalid YouTube URL
- Invalid command data

**NotFoundException**
- Song not found
- Album not found

**ConflictException**
- Duplicate record (handled by deduplication)

---

## Related Documentation

- [Service Documentation](./02-service.md) - Service layer
- [Queries Documentation](./04-queries.md) - Read operations
- [Repository Documentation](./05-repository.md) - Data access
- [Jobs Module](../jobs/00-overview.md) - Job processing

---

**Previous**: [Service Documentation](./02-service.md)  
**Next**: [Queries Documentation](./04-queries.md)

---

## 📚 Learning Notes

> Ghi lại những điểm quan trọng đã học và hiểu được trong quá trình đọc code.

---

### 🧠 Hiểu đúng về SongResponseDto

**Nhầm lẫn hay gặp:** "DTO là để lưu dữ liệu"  
**Thực tế:** DTO = Data Transfer Object — là **cái khuôn định dạng** trước khi gửi về client.

```
Database (Track entity) → SongMapper.mapToResponse() → SongResponseDto → Client
```

- Lưu dữ liệu → dùng `SongRepository.create()`
- Gửi về client → dùng `SongResponseDto`
- Hai thứ hoàn toàn khác nhau

---

### 🧠 Phân biệt `id` vs `youtubeId` (sourceId)

| Trường | Ví dụ | Ý nghĩa |
|--------|--------|---------|
| `id` | `uuid-abc-123` | Khóa chính trong DB của hệ thống — mỗi user/album tạo ra 1 `id` riêng |
| `sourceId` (youtubeId) | `dQw4w9WgXcQ` | ID video trên YouTube — **10 người cùng thêm 1 bài = 10 `id` khác nhau nhưng cùng 1 `youtubeId`** |

**Tại sao quan trọng?** Vì toàn bộ logic deduplication xoay quanh `youtubeId`, không phải `id`.

---

### 🧠 Logic Deduplication 3 tầng — tại sao cần cả 3?

```
Tầng 1: findByYoutubeId (url != '')
  → Bài đã convert xong → reuse ngay, không cần download lại

Tầng 2: findPendingByYoutubeId (url == '')
  → Bài đang convert → tạo record mới nhưng KHÔNG enqueue job mới
  → Khi convert xong, Worker sẽ update TẤT CẢ record có cùng youtubeId

Tầng 3: Race condition guard
  → Hai request đến cùng lúc, cùng vượt qua tầng 1+2
  → Cả hai tạo pending record
  → Cái tạo sau tìm thấy cái trước → xóa bản thân, dùng bản thắng
```

**Điểm hay:** Tầng 3 dùng `raceCheck.id !== song.id` để phân biệt "tìm thấy chính mình" vs "tìm thấy kẻ khác".

---

### 🧠 Cơ chế "cả 2 user đều nhận được nhạc khi convert xong"

```
User A thêm bài → Tạo record A (url='') → Enqueue job
User B thêm bài → Tìm pending của A → Tạo record B (url='')  ← KHÔNG enqueue job

[Worker convert xong]
→ Worker update: prisma.track.update({ where: { id: songId }, data: { url: publicUrl } })
→ CHỈ update record A (vì songId là của A)
→ Record B vẫn url=''... 
```

> ⚠️ **Điểm cần chú ý:** Worker hiện tại chỉ update 1 record theo `songId`. Nếu muốn update cả record B, cần thêm logic `updateMany` theo `youtubeId`. Đây là điểm có thể cải thiện.

---

### 🧠 Tại sao `@InjectQueue` và `@InjectPinoLogger` không phải là service bình thường?

**`@InjectQueue('conversion')`:**
- Không phải class tự viết — là NestJS inject một Queue object từ BullMQ
- Queue này kết nối tới Redis
- Dùng để `.add()` job, không xử lý gì cả

**`@InjectPinoLogger(ClassName.name)`:**
- Logger được bind với tên class cụ thể
- Mỗi log tự động kèm `context: 'CreateSongFromYoutubeHandler'`
- Giúp filter log theo class khi debug

**Tại sao không dùng `new Logger()` thông thường?**
- `PinoLogger` output JSON structured — searchable trên Loki/Datadog
- NestJS Logger output text thường — khó query

---

### 🧠 Job ID Pattern — lớp dedup thứ 4

```typescript
jobId: `convert:${youtubeId}`
```

Nếu BullMQ đã có job với `jobId: convert:dQw4w9WgXcQ` trong queue → **tự động bỏ qua** job mới.  
Đây là lớp bảo vệ cuối cùng, ngay tại tầng Queue.

**4 lớp deduplication theo thứ tự:**
1. DB: bài đã convert xong → reuse URL
2. DB: bài đang pending → reuse pending record
3. DB: race condition sau khi tạo pending
4. Queue: jobId trùng → BullMQ tự reject

---

### 🧠 Tại sao `createPendingSong` tạo record với `url: ''`?

```typescript
url: '',  // Pending state
```

Đây là convention của codebase: `url = ''` = **đang convert**, `url = 'https://...'` = **sẵn sàng phát**.  
`findByYoutubeId` tìm theo `url: { not: '' }`, `findPendingByYoutubeId` tìm theo `url: ''`.

**Điểm hay:** Không cần thêm column `status` riêng — dùng chính `url` để phân biệt trạng thái. Đơn giản và hiệu quả.

---

### 🧠 Khi nào dùng CQRS vs Service thông thường?

| Dùng CQRS | Dùng Service thường |
|-----------|---------------------|
| Logic phức tạp nhiều bước | CRUD đơn giản |
| Cần trace audit rõ ràng | Logic ít thay đổi |
| Write và Read cần scale riêng | Team nhỏ, ít người |
| Songs, Orders, Payments | Albums, Users cơ bản |

Trong project này: **Songs dùng CQRS**, **Albums dùng Service thường** — hoàn toàn hợp lý.

---

### 💡 Điểm code hay đáng học

```typescript
// Ponytail pattern: return sớm thay vì if lồng nhau
if (existingTrack) return this.songMapper.mapToResponse(reusedSong);
if (pendingTrack) return this.songMapper.mapToResponse(reusedSong);
// Code chính ở cuối, không bị chôn trong else
```

```typescript
// artist fallback: dùng artist của track có sẵn nếu user không nhập
artist: artist || existingTrack.artist,
```

```typescript
// Private helper tách riêng — tên nói lên ý nghĩa
private createPendingSong(...)
private enqueueConversionJob(...)
// execute() chỉ đọc như bản tóm tắt, không đọc từng dòng logic
```

---

**Last Updated**: 2026-07-09 — Buổi học Songs module và Deduplication logic
