# Production-Grade Checklist — 5 Câu Hỏi Trước Khi Nói Code "Done"

> **Nguyên tắc**: "Done" không phải là "chạy được trên local". "Done" là "chạy được ở production lúc 2h sáng khi không có ai online để fix".

---

## 5 Câu Hỏi Bắt Buộc (Áp Dụng Cho Mọi Feature)

### ❶ Fail Mode — "Dependency chết thì code tôi làm gì?"

**Câu hỏi cụ thể**:
- Database ngắt kết nối giữa lúc request đang xử lý?
- Redis hết RAM giữa lúc cache write?
- External API (Google Drive, yt-dlp, Supabase) timeout?
- yt-dlp binary không tìm thấy trên host?

**3 kiểu fail mode, chỉ 1 kiểu chấp nhận được**:

| Fail Mode | Ví dụ | Có chấp nhận được? |
|-----------|-------|-------------------|
| **Throw rõ ràng** | `throw new ServiceUnavailableException('DB connection failed')` | ✅ Tốt — caller biết và handle |
| **Silent fail** | `catch(e) { return null; }` không log gì | ❌ Tệ — caller không biết, data inconsistent |
| **Hang vô thời hạn** | Network call không có timeout | ❌ Nguy hiểm — block thread, exhaust connection pool |

**Pattern đúng trong project này**:
```typescript
// ✅ DownloaderService — throw rõ ràng với classification
try {
  await this.spawnYtDlp(url, outputPath);
} catch (stderr) {
  if (stderr.includes('Video unavailable')) {
    throw new NotFoundException('Video not found or private');
  }
  if (stderr.includes('Requested format is not available')) {
    throw new BadRequestException('Requested format not available');
  }
  throw new InternalServerErrorException('Download failed');
}
```

**Checklist khi review code của bạn**:
- [ ] Mọi external call có timeout configured không?
- [ ] Catch block có throw (hoặc handle) hay nuốt error im lặng?
- [ ] Nếu dependency fail, có thông báo rõ ràng để caller/monitor biết không?

---

### ❷ Idempotency — "Request chạy 2 lần thì sao?"

**Tại sao quan trọng**: Network timeout → client retry → server nhận 2 request giống nhau → duplicate data. Đây là bug thường xảy ra khi network chậm, khi frontend có auto-retry, hoặc khi user click nhanh.

**Test idempotency**:
```
Scenario: User click "Import" 2 lần trong 500ms
Expected: Chỉ tạo 1 track, không tạo 2 track
```

**3 kỹ thuật xử lý idempotency**:

| Kỹ thuật | Khi nào dùng | Ví dụ trong project |
|----------|-------------|---------------------|
| **Natural key check** | Resource có identifier tự nhiên | `sourceId` check trước khi download YouTube |
| **DB unique constraint** | Insert với unique key | `Album(userId, isDefault)` unique constraint |
| **Idempotency key header** | Payment/transaction APIs | (không có trong project này — cải tiến tiềm năng) |

**Pattern natural key check**:
```typescript
// ✅ Trước khi tạo mới, check đã tồn tại chưa
const existing = await this.songRepository.findFirst({
  where: { 
    sourceType: 'youtube', 
    sourceId: youtubeId, 
    url: { not: '' }  // chỉ reuse nếu đã process xong
  }
});

if (existing) {
  return existing;  // return ngay, không enqueue job mới
}
```

**Checklist**:
- [ ] Nếu POST request này chạy 2 lần, DB có 2 record hay 1 record?
- [ ] Nếu job được enqueue 2 lần, worker xử lý 2 lần hay 1 lần?
- [ ] Mutation operation có unique constraint backup không?

---

### ❸ Observability — "Nếu lỗi xảy ra lúc 2h sáng, log có đủ thông tin để debug không cần SSH?"

**Câu hỏi thực tế**: Nếu user báo "tôi import bài hát từ Google Drive xong thấy báo lỗi" — bạn có thể tìm ra vấn đề chỉ từ log không? Hay phải SSH vào server, reproduce, debug thủ công?

**Thông tin tối thiểu một log entry cần có**:

```
{
  "level": "error",
  "time": "2024-01-15T02:13:45.123Z",
  "requestId": "req-abc123",      // trace request xuyên suốt
  "userId": "user-456",           // biết ai gặp lỗi
  "action": "google-drive-import",
  "fileId": "1abc...",            // input cụ thể
  "error": "Token expired",       // lỗi gì
  "stack": "...",                 // ở đâu
  "durationMs": 1234              // mất bao lâu trước khi fail
}
```

**Antipattern phổ biến**:
```typescript
// ❌ Thiếu context — biết có lỗi nhưng không biết gì thêm
logger.error('Import failed');

// ❌ Log thừa — sensitive data trong log
logger.debug({ token: googleToken, ... });  // token lộ trong log!

// ✅ Đúng — đủ context, không leak secret
logger.error({
  action: 'google-drive-import',
  userId,
  fileId,
  error: error.message,  // message, không phải object với stack trace đầy đủ
  durationMs: Date.now() - startTime,
});
```

**Structured logging vs string logging**:
- String: `logger.error('Failed to import file ' + fileId)` — khó search, khó filter
- Structured: `logger.error({ action: 'import', fileId, error })` — Kibana/Loki có thể filter `fileId == "abc"` trong seconds

**Pattern trong project**:
```typescript
// LoggingInterceptor — log chuẩn cho mọi HTTP request
{
  method: 'POST',
  url: '/songs/youtube',
  statusCode: 202,
  durationMs: 45,
  userId: 'user-123',
  // authorization header bị redact tự động
}
```

**Checklist**:
- [ ] Log có requestId / correlationId để trace xuyên suốt flow không?
- [ ] Error log có đủ context (input, userId, action) không?
- [ ] Sensitive fields (token, password) có bị redact không?
- [ ] Có cách filter log theo userId hay requestId không?

---

### ❹ Secret Handling — "Token/password có bao giờ lộ ra không?"

**3 nơi secret hay bị lộ**:

| Nơi bị lộ | Ví dụ | Cách phòng |
|-----------|-------|------------|
| **Log** | `logger.debug(requestHeaders)` — include Authorization | Redact trong interceptor và logger config |
| **Response** | `/users` trả về cả `passwordHash` | Dùng `@Expose()` DTO, `excludeExtraneousValues: true` |
| **Git** | Commit `.env` hoặc hardcode secret | `.gitignore`, `git-secrets` hook |

**Pattern redact trong project**:
```typescript
// pino config — redact ở log level
pino({
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    'body.password',
    'body.accessToken',
  ]
})

// LoggingInterceptor — redact thêm ở HTTP layer
const safeHeaders = { ...headers };
delete safeHeaders['authorization'];
```

**Double-layer redact**: Nếu một lớp bị misconfigure, lớp kia vẫn che được. Defense in depth áp dụng cho cả logging.

**DTO serialization để không leak DB fields**:
```typescript
// ❌ Trả về raw Prisma object — có cả passwordHash, googleAccessToken
return this.userRepository.findOne(id);

// ✅ Chỉ trả về field được @Expose() — safe by default
return plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
```

**Checklist**:
- [ ] `git log --all -- "*.env"` — không có env file trong git history?
- [ ] Response API không có `password`, `hash`, `token` field?
- [ ] Log search `authorization: Bearer` — không thấy raw token?
- [ ] `grep -r "process.env.*||" src/` — không có `|| 'default-secret'` fallback?

---

### ❺ Resource Cleanup — "File tạm, connection, job — ai dọn khi happy path không xảy ra?"

**Resources cần cleanup**:

| Resource | Tạo ở đâu | Dọn ở đâu | Nếu không dọn |
|----------|-----------|-----------|---------------|
| Temp file MP3 | `yt-dlp` download | `cleanup()` trong try/catch | Disk full |
| DB connection | Request start | Connection pool auto-return | Connection exhausted |
| OAuth state | `generateAuthUrl()` | Cache TTL tự expire | Stale state table |
| Stuck BullMQ job | Worker crash | Cron cleanup mỗi giờ | Queue backlog tăng |

**Pattern cleanup đúng**:
```typescript
// ✅ Cleanup trong cả success VÀ failure path
async process(job: Job): Promise<void> {
  let outputPath: string | undefined;
  try {
    outputPath = await this.downloaderService.download(job.data.url);
    await this.storageService.upload(outputPath);
    await this.trackRepository.update(job.data.trackId, { status: 'DONE' });
  } catch (error) {
    await this.trackRepository.update(job.data.trackId, { status: 'FAILED' });
    throw error;  // re-throw để BullMQ biết job fail, retry nếu cần
  } finally {
    if (outputPath) {
      await this.downloaderService.cleanup(outputPath);  // LUÔN cleanup
    }
  }
}
```

**Tại sao `finally` thay vì `catch`**:
- `try { ... cleanup() } catch { cleanup() }` — cleanup bị duplicate, dễ quên
- `finally { cleanup() }` — chạy 1 lần duy nhất dù success hay failure

**Self-healing cron cho stuck jobs**:
```typescript
// Mỗi giờ, tìm và dọn orphaned resources
@Cron('0 * * * *')
async cleanupOrphanedResources(): Promise<void> {
  // 1. Jobs stuck > 2h (worker crash)
  const stuckJobs = await this.downloadJobRepo.findMany({
    where: {
      status: { in: ['PENDING', 'PROCESSING'] },
      updatedAt: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) }
    }
  });
  
  // 2. Temp files > 1h (không thuộc job nào đang chạy)
  const oldTempFiles = await this.findTempFiles({ olderThan: '1h' });
}
```

**Checklist**:
- [ ] Mọi file tạm đều có code cleanup trong cả success và failure path?
- [ ] Có cron job hoặc mechanism tự dọn resource bị orphan không?
- [ ] DB connection có được return về pool khi request xong không?
- [ ] Cache entry có TTL không, hay tồn tại mãi mãi?

---

## Self-Review Template

Dán vào PR description hoặc tự check trước khi commit:

```markdown
## Production Readiness Check

### Fail Mode
- [ ] External dependency X fail → throws [ExceptionType], không silent fail
- [ ] Timeout configured: [Xms] cho [dependency]

### Idempotency  
- [ ] Request duplicate → [1 record / idempotent behavior]
- [ ] Unique constraint: [field/index]

### Observability
- [ ] Error log có: userId, action, input, error message
- [ ] Sensitive fields redacted: [list fields]

### Secret Handling
- [ ] Không có secret trong response
- [ ] Không có secret trong log
- [ ] Không có secret hardcoded

### Resource Cleanup
- [ ] Temp resources cleaned up in: [try/finally/cron]
- [ ] Cleanup verified in failure path
```

---

## Khoảng Cách Giữa Code "Học Sinh" và Code "Kỹ Sư"

| Code "Học sinh" | Code "Kỹ sư" |
|----------------|--------------|
| Chỉ viết happy path | Write for failure first |
| Cleanup chỉ ở success | Cleanup ở cả failure (finally) |
| Log string đơn giản | Structured log với context |
| `|| 'default'` cho secret | Crash nếu thiếu secret |
| Không nghĩ đến retry | Design idempotent từ đầu |
| Test chỉ happy path | Test failure paths và edge cases |

Kỹ sư không viết code "tốt hơn" — họ viết code **anticipate failure** từ đầu.
