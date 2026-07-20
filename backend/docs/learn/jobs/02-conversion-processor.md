# ConversionProcessor Documentation

## Overview
The `ConversionProcessor` is a BullMQ job processor that handles YouTube to MP3 conversion. It downloads audio from YouTube, uploads to Supabase Storage, and updates the database with the public URL.

## File Location
`backend/src/jobs/conversion.processor.ts`

## Processor Configuration

```typescript
@Processor('conversion', { concurrency: 2 })
export class ConversionProcessor extends WorkerHost {
  constructor(
    @InjectPinoLogger(ConversionProcessor.name)
    private readonly logger: PinoLogger,
    private readonly downloaderService: DownloaderService,
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
    private readonly appLogger: AppLogger,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any>
}
```

### Decorator
```typescript
@Processor('conversion', { concurrency: 2 })
```

**Purpose**: Register as a processor for the 'conversion' queue

**Concurrency**: 2
- **Why 2?**: YouTube download is CPU-intensive
- **Balance**: Prevents server overload while maintaining speed
- **Alternative**: Higher concurrency = faster but more resource usage

---

## Process Method

### Signature
```typescript
async process(job: Job<any, any, string>): Promise<any>
```

### Job Data
```typescript
const { url, songId, userId } = job.data;
```

**Properties:**
- `url` - YouTube URL to download from
- `songId` - Database ID of the song record
- `userId` - ID of the user who requested the song

---

## Processing Flow

```typescript
async process(job: Job<any, any, string>): Promise<any> {
  const { url, songId, userId } = job.data;
  const processName = 'YouTube Conversion';

  // 1. Start logging section
  this.appLogger.startSection(processName, `jobId=${job.id} songId=${songId}`);

  // 2. Create temp directory
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const outputPath = path.join(tempDir, `${songId}.mp3`);

  try {
    // 3. Download from YouTube
    this.appLogger.step('Downloading from YouTube');
    await this.downloaderService.download(url, outputPath);

    // 4. Upload to Supabase Storage (streaming)
    this.appLogger.step('Uploading to Supabase Storage');
    const storagePath = `songs/${songId}.mp3`;
    const fileStream = fs.createReadStream(outputPath);
    await this.storageService.uploadStream(fileStream, 'music', storagePath);

    // 5. Get Public URL
    this.appLogger.step('Getting public URL');
    const publicUrl = await this.storageService.getPublicUrl('music', storagePath);

    // 6. Update Database
    this.appLogger.step('Updating database record');
    await this.prisma.track.update({
      where: { id: songId },
      data: { url: publicUrl },
    });

    // 7. Cleanup temp file
    this.appLogger.step('Cleaning up temp file');
    await this.downloaderService.cleanup(outputPath);

    // 8. End logging section
    this.appLogger.endSection(processName, `songId=${songId}`);

    return { storagePath, publicUrl };
  } catch (error) {
    // 9. Error handling
    this.appLogger.processError(processName, error, 'Job Processing');
    await this.downloaderService.cleanup(outputPath);
    throw error;
  }
}
```

---

## Step-by-Step Breakdown

### 1. Start Logging Section
```typescript
this.appLogger.startSection(processName, `jobId=${job.id} songId=${songId}`);
```

**Purpose**: Begin structured logging for the job

**Benefits:**
- Clear job boundaries in logs
- Easy to trace job execution
- Correlate logs with job ID

---

### 2. Create Temp Directory
```typescript
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}
const outputPath = path.join(tempDir, `${songId}.mp3`);
```

**Purpose**: Ensure temp directory exists and define output path

**Path**: `temp/{songId}.mp3`

**Why temp directory?**
- Isolates temporary files
- Easy cleanup
- Prevents conflicts

---

### 3. Download from YouTube
```typescript
this.appLogger.step('Downloading from YouTube');
await this.downloaderService.download(url, outputPath);
```

**Purpose**: Download audio from YouTube to temp file

**Service**: `DownloaderService`

**Implementation**: Uses yt-dlp binary

**Output**: MP3 file at `temp/{songId}.mp3`

**Duration**: 30-120 seconds (depends on video length)

---

### 4. Upload to Supabase Storage (Streaming)
```typescript
this.appLogger.step('Uploading to Supabase Storage');
const storagePath = `songs/${songId}.mp3`;
const fileStream = fs.createReadStream(outputPath);
await this.storageService.uploadStream(fileStream, 'music', storagePath);
```

**Purpose**: Upload MP3 to Supabase Storage

**Storage Path**: `songs/{songId}.mp3`

**Bucket**: `music`

**Method**: Streaming upload

**Why Streaming?**
```typescript
// Bad (Buffering - causes OOM)
const buffer = fs.readFileSync(outputPath); // Loads entire file into memory
await storageService.upload(buffer);

// Good (Streaming - constant memory)
const stream = fs.createReadStream(outputPath); // Reads in chunks
await storageService.uploadStream(stream);
```

**Benefits:**
- Constant memory usage
- Handles large files (100MB+)
- Upload starts immediately

---

### 5. Get Public URL
```typescript
this.appLogger.step('Getting public URL');
const publicUrl = await this.storageService.getPublicUrl('music', storagePath);
```

**Purpose**: Generate public URL for the uploaded file

**Format**: `https://supabase.storage.com/...`

**Usage**: Stored in database for client access

---

### 6. Update Database
```typescript
this.appLogger.step('Updating database record');
await this.prisma.track.update({
  where: { id: songId },
  data: { url: publicUrl },
});
```

**Purpose**: Update song record with public URL

**Before**: `url = ''` (pending)
**After**: `url = 'https://...'` (completed)

**Why Last?**
- Only mark as complete when file is successfully stored
- Ensures consistent state
- Prevents broken URLs in database

---

### 7. Cleanup Temp File
```typescript
this.appLogger.step('Cleaning up temp file');
await this.downloaderService.cleanup(outputPath);
```

**Purpose**: Delete temporary MP3 file

**Why Cleanup?**
- Prevents disk space accumulation
- Removes sensitive data
- Maintains server health

---

### 8. End Logging Section
```typescript
this.appLogger.endSection(processName, `songId=${songId}`);
```

**Purpose**: Mark job completion in logs

**Return**: `{ storagePath, publicUrl }`

---

### 9. Error Handling
```typescript
catch (error) {
  this.appLogger.processError(processName, error, 'Job Processing');
  await this.downloaderService.cleanup(outputPath);
  throw error;
}
```

**Purpose**: Handle errors and cleanup

**Steps:**
1. Log error with context
2. Cleanup temp file (even on failure)
3. Re-throw error (triggers BullMQ retry)

**Why Cleanup on Error?**
- Prevents orphaned temp files
- Frees disk space
- Avoids accumulation of failed downloads

---

## Error Handling

### On Worker Event
```typescript
@OnWorkerEvent('error')
onError(err: Error) {
  this.logger.error({ error: err.message }, '❌ BullMQ worker error');
}
```

**Purpose**: Log worker-level errors

**Triggers When:**
- Worker initialization fails
- Unhandled exceptions in processor
- Redis connection errors

---

## Retry Logic

### Automatic Retries
Configured in JobsModule:
```typescript
defaultJobOptions: {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
}
```

**Retry Timeline:**
```
Attempt 1: Immediate
  ↓ Failure
Attempt 2: 5 seconds later
  ↓ Failure
Attempt 3: 10 seconds later
  ↓ Failure
Job marked as failed
```

### Common Retriable Errors
- Network timeouts
- YouTube rate limiting
- Supabase transient errors
- Redis connection issues

### Non-Retriable Errors
- Invalid YouTube URL
- File system errors
- Database constraint violations
- Permanent service failures

---

## Performance Considerations

### Concurrency
```typescript
@Processor('conversion', { concurrency: 2 })
```

**Why 2?**
- YouTube download is CPU-intensive
- Prevents server overload
- Balance speed and stability

**Trade-offs:**
- Higher concurrency = faster processing
- Higher concurrency = more resource usage
- Lower concurrency = slower processing
- Lower concurrency = less resource usage

### Memory Usage
**Streaming Upload:**
- Constant memory usage
- Independent of file size

**Buffering (Bad):**
- Memory usage = file size
- OOM risk for large files

### Disk Usage
**Temp Files:**
- Cleaned up after each job
- CleanupService removes orphaned files
- Prevents disk exhaustion

---

## Logging

### AppLogger Usage
```typescript
this.appLogger.startSection(name, context)
this.appLogger.step(message)
this.appLogger.endSection(name, context)
this.appLogger.processError(name, error, context)
```

**Benefits:**
- Structured logging
- Clear job boundaries
- Easy debugging
- Performance tracking

### Log Example
```
[INFO] Starting YouTube Conversion: jobId=123 songId=abc
[INFO] Downloading from YouTube
[INFO] Uploading to Supabase Storage
[INFO] Getting public URL
[INFO] Updating database record
[INFO] Cleaning up temp file
[INFO] Completed YouTube Conversion: songId=abc
```

---

## Dependencies

### Constructor
```typescript
constructor(
  @InjectPinoLogger(ConversionProcessor.name)
  private readonly logger: PinoLogger,
  private readonly downloaderService: DownloaderService,
  private readonly storageService: StorageService,
  private readonly prisma: PrismaService,
  private readonly appLogger: AppLogger,
) {
  super();
}
```

**Dependencies:**
- `PinoLogger` - Structured logging
- `DownloaderService` - YouTube download
- `StorageService` - Supabase upload
- `PrismaService` - Database operations
- `AppLogger` - Job logging

---

## Testing

### Unit Tests
```typescript
describe('ConversionProcessor', () => {
  let processor: ConversionProcessor;
  let downloaderService: DownloaderService;
  let storageService: StorageService;
  let prisma: PrismaService;

  beforeEach(() => {
    downloaderService = { download: jest.fn(), cleanup: jest.fn() } as any;
    storageService = { uploadStream: jest.fn(), getPublicUrl: jest.fn() } as any;
    prisma = { track: { update: jest.fn() } } as any;
    processor = new ConversionProcessor(logger, downloaderService, storageService, prisma, appLogger);
  });

  it('should process conversion job', async () => {
    const job = { data: { url: 'https://youtube.com/watch?v=abc', songId: '123' } } as any;
    
    downloaderService.download.mockResolvedValue(undefined);
    storageService.uploadStream.mockResolvedValue(undefined);
    storageService.getPublicUrl.mockResolvedValue('https://...');
    prisma.track.update.mockResolvedValue({});

    const result = await processor.process(job);

    expect(downloaderService.download).toHaveBeenCalled();
    expect(storageService.uploadStream).toHaveBeenCalled();
    expect(prisma.track.update).toHaveBeenCalledWith({
      where: { id: '123' },
      data: { url: 'https://...' }
    });
  });

  it('should cleanup on error', async () => {
    const job = { data: { url: 'https://youtube.com/watch?v=abc', songId: '123' } } as any;
    
    downloaderService.download.mockRejectedValue(new Error('Download failed'));

    await expect(processor.process(job)).rejects.toThrow();
    expect(downloaderService.cleanup).toHaveBeenCalled();
  });
});
```

---

## Troubleshooting

### Job Stuck in Processing
**Symptom**: Job stays in 'active' state forever

**Solutions:**
1. Check processor logs for errors
2. Verify yt-dlp binary exists
3. Check disk space
4. Test Redis connection
5. Restart worker process

### Download Fails
**Symptom**: Job fails at download step

**Solutions:**
1. Check YouTube URL is valid
2. Verify yt-dlp is up to date
3. Check network connectivity
4. Test yt-dlp manually: `./yt-dlp https://youtube.com/watch?v=abc`

### Upload Fails
**Symptom**: Job fails at upload step

**Solutions:**
1. Check Supabase credentials
2. Verify bucket exists
3. Check file size limits
4. Test upload manually

### Database Update Fails
**Symptom**: Job fails at database update

**Solutions:**
1. Check song record exists
2. Verify database connection
3. Check for constraint violations
4. Review Prisma logs

---

## Related Documentation

- [Module Documentation](./01-module.md) - Queue configuration
- [Cleanup Documentation](./03-cleanup-service.md) - Scheduled cleanup
- [Downloader Service](../../downloader/README.md) - YouTube download
- [Storage Service](../../storage/README.md) - Supabase upload

---

**Previous**: [Module Documentation](./01-module.md)  
**Next**: [Cleanup Documentation](./03-cleanup-service.md)

---

## 📚 Learning Notes

> Ghi lại những điểm quan trọng đã học từ ConversionProcessor và kiến trúc Jobs module.

---

### 🧠 Tại sao phải dùng Queue thay vì xử lý trực tiếp trong API?

**Nếu xử lý trực tiếp trong HTTP request:**
```
User gửi request → API gọi yt-dlp → đợi 30-120 giây → timeout → ❌
```

**Với Queue:**
```
User gửi request → tạo record (url='') → trả về ngay ✅
[Ngầm] Worker xử lý yt-dlp → upload → update DB → bài hát sẵn sàng
```

**Queue giải quyết 3 vấn đề:**
1. HTTP timeout (thường 30s) — tải nhạc có thể mất 2 phút
2. Server overload — không bị 100 request tải nhạc cùng lúc đánh sập
3. Retry khi lỗi — network tạm thời down vẫn tự thử lại

---

### 🧠 Hai loại lỗi trong BullMQ — phân biệt rõ

| Loại lỗi | Xảy ra ở đâu | Xử lý như thế nào |
|----------|-------------|-------------------|
| **Business error** | Trong `process()` | `try/catch` → `throw error` → BullMQ retry |
| **Worker error** | Infrastructure (Redis, Worker init) | `@OnWorkerEvent('error')` → chỉ log |

```typescript
// Business error — trong process()
} catch (error) {
  await cleanup(); // dọn file trước
  throw error;     // throw để BullMQ biết mà retry
}

// Worker error — tầng infrastructure
@OnWorkerEvent('error')
onError(err: Error) {
  this.logger.error({ error: err.message }, '❌ BullMQ worker error');
  // Không throw — không có gì để retry ở tầng này
}
```

**Điểm quan trọng:** Nếu nuốt lỗi không `throw` trong `process()`, BullMQ tưởng job thành công → không retry → bài hát mãi ở trạng thái pending.

---

### 🧠 Streaming vs Buffering — tại sao phải dùng stream?

```typescript
// ❌ Buffering — nguy hiểm với file lớn
const buffer = fs.readFileSync('song.mp3'); // Load 50MB vào RAM
await storage.upload(buffer);              // Server dễ OOM

// ✅ Streaming — memory cố định ~64KB
const stream = fs.createReadStream('song.mp3'); // Đọc từng chunk
await storage.uploadStream(stream);             // Upload ngay khi đọc
```

**Tại sao bài nhạc có thể lớn?**
- Video 4K → audio trích xuất → có thể 50-200MB
- `concurrency: 2` → 2 bài cùng lúc → 400MB RAM nếu buffer
- Stream → chỉ ~128KB RAM bất kể file lớn cỡ nào

---

### 🧠 Tại sao update DB phải là bước CUỐI CÙNG?

```typescript
// Thứ tự đúng:
1. Download → có file .mp3 trên disk
2. Upload lên Supabase → file trên cloud
3. Lấy public URL
4. Update DB: url = publicUrl  ← Chỉ sau khi chắc chắn file đã lên cloud
5. Xóa file tạm
```

**Nếu update DB sớm hơn:**
- Upload đang chạy thì mạng đứt
- DB đã có URL nhưng file chưa lên Supabase
- User click play → 404 ❌

**Nguyên tắc:** Chỉ đánh dấu "done" khi thực sự done. Consistency > speed.

---

### 🧠 `concurrency: 2` — con số này đến từ đâu?

```typescript
@Processor('conversion', { concurrency: 2 })
```

**Tại sao 2 chứ không phải 10?**
- yt-dlp tốn nhiều CPU/Network
- 10 bài cùng tải = YouTube có thể rate-limit IP
- 10 bài cùng upload = Supabase có thể throttle

**Tại sao không phải 1?**
- 1 bài tải xong mới tải bài tiếp → chậm không cần thiết
- 2 bài song song = tốc độ gần gấp đôi với resource gần như không đổi

**Quy tắc chung:** `concurrency = số tác vụ I/O mà server chịu được mà không ảnh hưởng latency`. Với download/upload thường là 2-5.

---

### 🧠 CleanupService — tại sao cần 2 loại cleanup?

**Loại 1: Dọn job bị treo (orphaned jobs)**
```typescript
// Job stuck PROCESSING/PENDING > 2 tiếng
// Nguyên nhân: server crash, kill process giữa chừng
// Xử lý: đánh dấu FAILED để biết cần retry thủ công
```

**Loại 2: Dọn file .mp3 tạm**
```typescript
// File > 1 tiếng tuổi
// Nguyên nhân: processor crash trước khi gọi cleanup()
// Xử lý: xóa để giải phóng ổ cứng
```

**Tại sao cần cả 2?**  
Processor đã có `cleanup()` trong `finally` rồi, nhưng nếu server chết đột ngột (kill -9, power cut) thì `finally` không chạy. CleanupService là **lớp bảo vệ thứ 2**.

---

### 🧠 `@Cron(CronExpression.EVERY_HOUR)` — tại sao 1 tiếng?

- Quá ngắn (1 phút) → query DB liên tục → lãng phí
- Quá dài (1 ngày) → file tạm tích tụ → ổ cứng đầy
- 1 tiếng = cân bằng giữa hai cực

**File tạm tối đa chiếm:** `concurrency (2) × max_song_size (200MB) × 1h` = vài trăm MB trước khi bị dọn. Chấp nhận được.

---

### 🧠 End-to-End Flow — bức tranh hoàn chỉnh

```
POST /songs/youtube  (songs module)
  │
  ├─ Validate album
  ├─ Extract youtubeId
  ├─ Check dedup (3 tầng)
  ├─ Create Track(url='')  ← DB
  └─ Queue.add('convert', {url, songId}, {jobId: 'convert:'+youtubeId})  ← Redis
       │
       │ [vài giây đến vài phút sau]
       │
       ▼
ConversionProcessor.process()  (jobs module)
  │
  ├─ DownloaderService.download(url, '/temp/songId.mp3')  ← yt-dlp
  ├─ StorageService.uploadStream(stream, 'music', 'songs/songId.mp3')  ← Supabase
  ├─ StorageService.getPublicUrl(...)  ← Supabase
  ├─ prisma.track.update({ url: publicUrl })  ← DB ← Bài hát "sống" tại đây
  └─ DownloaderService.cleanup('/temp/songId.mp3')  ← disk

[Mỗi tiếng]
CleanupService.handleCron()
  ├─ cleanupOrphanedJobs()  ← DB
  └─ cleanupTempFiles()  ← disk
```

---

### 💡 Điểm code hay trong jobs module

```typescript
// Smart TLS detection — không cần if/else rườm rà
tls: process.env.REDIS_HOST?.includes('upstash') ? {} : undefined
```

```typescript
// Cleanup luôn chạy dù thành công hay thất bại
try {
  await downloaderService.download(url, outputPath);
  await storageService.uploadStream(...);
  // ...
} catch (error) {
  throw error;  // re-throw để retry
} finally {
  await downloaderService.cleanup(outputPath);  // ← luôn dọn dù lỗi hay không
}
// Nhưng code hiện tại dùng catch thay vì finally — cũng được vì cleanup trước khi throw
```

```typescript
// File naming dùng songId thay vì random — dễ debug, idempotent
const outputPath = path.join(tempDir, `${songId}.mp3`);
// Nếu job retry, cùng songId = cùng path = overwrite file cũ thay vì tạo file mới
```

---

### 🔗 Mối quan hệ Songs ↔ Jobs

| Songs (handler) | Jobs (processor) |
|-----------------|------------------|
| Tạo job | Nhận job |
| Truyền `{ url, songId, userId }` | Dùng `{ url, songId, userId }` |
| `url: ''` (pending) | Update `url: publicUrl` (done) |
| `jobId: convert:${youtubeId}` | BullMQ match bằng jobId |

**Kết nối duy nhất giữa 2 module là Redis Queue** — không import trực tiếp nhau → loose coupling ✅

---

**Last Updated**: 2026-07-09 — Buổi học Jobs module, Queue pattern, và luồng end-to-end
