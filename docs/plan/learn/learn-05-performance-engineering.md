# Performance Engineering — Tối Ưu Đúng Chỗ, Không Phải Tối Ưu Tất Cả

> **Nguyên tắc**: "Premature optimization is the root of all evil" — Donald Knuth. Nhưng "không bao giờ nghĩ đến performance" cũng là root of all evil khác. Bí quyết là **tối ưu đúng nơi, đúng lúc, đúng kỹ thuật**.

---

## Framework Tư Duy: 3 Câu Hỏi Trước Khi Tối Ưu

```
1. "Đo được không?" → Nếu không có metric, bạn đang đoán
2. "Bottleneck ở đâu?" → Tối ưu sai chỗ không giúp ích gì
3. "Trade-off là gì?" → Mọi optimization đều có cost
```

---

## I. Database Performance

### N+1 Query — Lỗi Phổ Biến Nhất

**Vấn đề**:
```typescript
// ❌ N+1: Lấy 50 songs → 50 query riêng lấy album → 51 query tổng
const songs = await songRepo.findMany();
for (const song of songs) {
  const album = await albumRepo.findOne(song.albumId);  // query riêng mỗi lần!
  song.albumName = album.name;
}
```

**Giải pháp — Eager Loading với Prisma**:
```typescript
// ✅ 1 query với JOIN (hoặc batched query)
const songs = await songRepo.findMany({
  include: { album: true }  // Prisma xử lý JOIN
});
```

**Giải pháp — Select specific fields (không include cả object)**:
```typescript
// ✅ Chỉ lấy field cần thiết, không fetch cả album object
const songs = await songRepo.findMany({
  select: {
    id: true,
    title: true,
    url: true,
    album: {
      select: { name: true }  // chỉ lấy album.name
    }
  }
});
```

**Khi nào dùng `include` vs `select`**:
- `include: { album: true }` — lấy toàn bộ album object
- `select: { album: { select: { name: true } } }` — chỉ lấy field cần, ít data transfer hơn

**Detect N+1 trong production**:
```
Dấu hiệu: DB query count tăng tuyến tính với số record trả về
Tool: Prisma query logging, DB slow query log, Datadog
```

---

### Promise.all() Cho Queries Độc Lập

**Sai lầm**:
```typescript
// ❌ Sequential — latency = query1 + query2
const total = await albumRepo.count({ where: { userId } });
const albums = await albumRepo.findMany({ where: { userId }, take: 20 });
```

**Đúng**:
```typescript
// ✅ Parallel — latency = max(query1, query2)
const [total, albums] = await Promise.all([
  albumRepo.count({ where: { userId } }),
  albumRepo.findMany({ where: { userId }, take: 20 }),
]);
```

**Tính toán thực tế**:
- Mỗi query: ~10ms (round-trip DB local)
- Sequential: 20ms
- Parallel: ~10ms (chỉ query chậm nhất)
- Ở production (DB remote): mỗi query ~50-100ms → sequential 100-200ms vs parallel ~50-100ms

**Khi nào KHÔNG dùng Promise.all()**:
```typescript
// ❌ Không thể parallel khi query sau phụ thuộc query trước
const user = await userRepo.findOne(userId);
const album = await albumRepo.findDefault(user.defaultAlbumId);  // cần user.defaultAlbumId
```

---

### Query Planning — Hiểu EXPLAIN ANALYZE

```sql
-- Chạy trước khi ship index mới
EXPLAIN ANALYZE
SELECT * FROM "Track" 
WHERE "userId" = 'user-123' 
ORDER BY "createdAt" DESC 
LIMIT 50;
```

**Đọc kết quả**:
```
Seq Scan on "Track"  (cost=0.00..1000.00 rows=50000)
  → KHÔNG CÓ INDEX — quét toàn bộ bảng

Index Scan using "Track_userId_idx" on "Track"  (cost=0.43..8.47 rows=50)
  → CÓ INDEX — lookup nhanh

Bitmap Heap Scan on "Track"  (cost=5.00..50.00 rows=500)
  → Index được dùng nhưng nhiều rows match
```

**Warning signs**:
- `Seq Scan` trên bảng lớn → thiếu index
- `Sort` tốn nhiều memory → thiếu index cho ORDER BY
- `rows=10000` nhưng thực tế chỉ cần 20 → index không selective

---

## II. Memory Management — Stream vs Buffer

### Vấn Đề Với Buffer

```typescript
// ❌ Buffer — load toàn bộ file vào RAM trước khi upload
const fileBuffer = fs.readFileSync('/tmp/song.mp3');  // 50MB vào RAM
await storageService.upload(fileBuffer);              // gửi 50MB lên Supabase
// Nếu 10 job chạy đồng thời: 500MB RAM chỉ cho files!
```

**Tại sao nguy hiểm**:
- MP3 file: 3-50MB mỗi file
- 2 jobs concurrent (concurrency=2): tối đa 100MB RAM chỉ cho file buffers
- Node.js heap limit default: 1.5GB → với concurrency cao hơn, OOM crash

### Stream — Memory Phẳng Không Phụ Thuộc File Size

```typescript
// ✅ Stream — đọc file và upload theo từng chunk
const readStream = fs.createReadStream('/tmp/song.mp3');  // mở file, chưa đọc
await storageService.uploadStream(readStream);             // pipe stream → Supabase

// Memory footprint: chỉ 1 chunk (thường 64KB) tại một thời điểm
// Dù file 500MB, RAM dùng vẫn chỉ vài MB
```

**Pipe stream giữa 2 external services**:
```typescript
// Download từ Google Drive → Upload thẳng lên Supabase
// Không tốn disk, không tốn RAM buffer
async importGoogleDriveFile(fileId: string): Promise<void> {
  const driveStream = await this.driveService.downloadFile(fileId);
  await this.storageService.uploadStream(driveStream);
  // File đi qua memory như nước qua ống — không tích tụ
}
```

**Khi nào CẦN buffer** (exception cases):
- Cần process toàn bộ content trước khi quyết định gì (hash file, validate)
- API bên kia không hỗ trợ stream (một số S3 pre-signed URL)
- Content nhỏ (<1MB) và cần xử lý nhiều lần

---

## III. Caching — Đúng Kỹ Thuật Cho Đúng Use Case

### Cache-Aside Pattern (Lazy Load)

```typescript
async getGoogleDriveStatus(userId: string): Promise<boolean> {
  const cacheKey = `gdrive:connected:${userId}`;
  
  // 1. Check cache
  const cached = await this.cacheManager.get<boolean>(cacheKey);
  if (cached !== undefined) return cached;  // Cache hit
  
  // 2. Cache miss — query source of truth
  const connected = await this.googleDriveService.isConnected(userId);
  
  // 3. Store in cache với TTL
  await this.cacheManager.set(cacheKey, connected, 300_000);  // 5 phút
  
  return connected;
}
```

**Quy tắc chọn TTL**:
| Data | TTL | Lý do |
|------|-----|-------|
| User profile | 5-10 phút | Thay đổi không thường xuyên |
| Drive connection status | 5 phút | Hậu quả stale nhỏ |
| Auth token validity | Không cache | Stale = security issue |
| Product catalog | 1 giờ | Static-ish |
| Exchange rates | 1 phút | Thay đổi thường xuyên nhưng ok if slightly stale |

### Cache Invalidation — Bài Toán Khó Nhất

```typescript
// ❌ Chỉ set TTL — có thể stale 5 phút dù user đã disconnect
await cacheManager.set('gdrive:status', true, 300_000);

// ✅ Invalidate khi state thay đổi
async disconnectGoogleDrive(userId: string): Promise<void> {
  await this.googleDriveService.revoke(userId);
  await this.cacheManager.del(`gdrive:connected:${userId}`);  // Xóa cache ngay
}
```

**Cache stampede prevention**:
```typescript
// Vấn đề: nhiều request đồng thời cache miss → tất cả gọi DB cùng lúc
// Giải pháp: single-flight pattern (chỉ 1 request thật, rest đợi)

// Với Redis:
const result = await this.redlock.acquire([`lock:${cacheKey}`], 5000, async () => {
  const cached = await cacheManager.get(cacheKey);
  if (cached) return cached;
  
  const fresh = await expensiveOperation();
  await cacheManager.set(cacheKey, fresh, TTL);
  return fresh;
});
```

### Khi Nào Không Nên Cache

❌ **JWT validation**: "user này có role ADMIN không" — nếu stale 5 phút, revoked token vẫn có quyền
❌ **Account balance**: Stale balance → user thấy sai số dư
❌ **Inventory count**: 2 user thấy "còn 1 sản phẩm" → 2 người mua → oversell

Nguyên tắc: Cache khi **chi phí stale thấp hơn chi phí luôn query fresh**.

### Database Caching (Redis cho Heavy Queries)

Cache không chỉ dùng cho state đơn giản (như Drive status). Nó cực kỳ cần thiết cho các query DB dùng hàm Aggregate phức tạp, Report thống kê, hoặc những endpoint gọi external API tốn chi phí (như LLM trong AI Agent).

**Thiết kế Cache Key đa tham số**:
Khi query bị chi phối bởi nhiều điều kiện, key bắt buộc phải bao quát được tất cả để chống ghi đè sai lệch dữ liệu người này sang người kia.
```typescript
// ❌ Key thiếu tham số: cache bị ghi đè, user query sort ASC thấy kết quả của DESC
const key = `search:${userId}`;

// ✅ Key chuẩn: nối tất cả các tham số có thể làm đổi output
const key = `search:${userId}:q_${query}:page_${page}:sort_${sortBy}`;
// Hoặc băm hash toàn bộ object params để lấy chuỗi định danh.
```

---

## IV. Queue & Worker Optimization

### Concurrency — Không Phải "Nhiều Hơn = Nhanh Hơn"

```typescript
// CPU-bound worker (transcode audio)
@Processor('conversion', { concurrency: 2 })  // ≈ số CPU cores / 2

// IO-bound worker (send email, webhook)
@Processor('notification', { concurrency: 10 })  // cao hơn vì chờ I/O

// Mixed (download + transcode)
@Processor('conversion', { concurrency: 2 })  // giới hạn bởi CPU-bound step
```

**Tại sao CPU-bound cần concurrency thấp**:
- 1 core không thể xử lý 2 ffmpeg tasks cùng lúc thực sự — chỉ context switch
- Context switch tốn overhead
- Tổng thời gian xử lý tăng, không giảm
- RAM: 2 ffmpeg process × 50MB RAM = 100MB → concurrency=4 thì 200MB

**Theo dõi worker metrics**:
```typescript
// BullMQ built-in events
queue.on('completed', (job, result) => {
  metrics.histogram('job.duration', job.finishedOn - job.processedOn, {
    queue: 'conversion',
    status: 'success'
  });
});

queue.on('failed', (job, error) => {
  metrics.increment('job.failed', { queue: 'conversion', error: error.name });
});
```

### Exponential Backoff — Tránh Retry Storm

```typescript
// ❌ Fixed interval retry — thundering herd khi service phục hồi
{ attempts: 3, backoff: 5000 }  // retry sau đúng 5s mỗi lần

// ✅ Exponential backoff với jitter
{ 
  attempts: 3, 
  backoff: { 
    type: 'exponential', 
    delay: 5000  // 1st: 5s, 2nd: 10s, 3rd: 20s
  } 
}

// Còn tốt hơn: backoff + random jitter
// 1st retry: 5s + random(0-2.5s)
// 2nd retry: 10s + random(0-5s)
// 3rd retry: 20s + random(0-10s)
// Tránh tất cả workers retry cùng lúc → đồng loạt hit service đang recover
```

---

## V. Logging Performance — Logging Cũng Có Chi Phí

### Log Level Theo Environment

```typescript
const level = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';
```

**Tại sao production nên dùng `warn` không phải `debug`**:
- `debug` log serialize objects → CPU overhead để stringify
- `debug` log write to disk/stdout → I/O overhead
- Ở 1000 req/s, log overhead có thể chiếm 5-10% CPU
- Production log nên chỉ chứa thông tin cần thiết cho debugging

### Structured Logging vs String Concatenation

```typescript
// ❌ String concat — slow (JS string allocation + GC pressure)
logger.debug('Processing song ' + songId + ' for user ' + userId);

// ✅ Structured — pino lazy-serializes chỉ khi cần log
logger.debug({ songId, userId }, 'Processing song');
// Nếu level là 'warn', dòng này gần như free (không serialize)
```

### Auto-logging Tắt — Dùng Custom Interceptor

```typescript
// ❌ pino-http auto-log mọi request — không control được fields
pino-http({ ... })

// ✅ Custom interceptor — log đúng field, đúng level, đúng lúc
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const start = Date.now();
    return next.handle().pipe(
      tap({
        next: () => {
          if (durationMs > 1000) {  // chỉ log request chậm
            this.logger.warn({ durationMs, path, method }, 'Slow request');
          }
        },
        error: (error) => {
          this.logger.error({ error: error.message, durationMs }, 'Request failed');
        }
      })
    );
  }
}
```

---

## VI. Payload Optimization

### Response Size Control

```typescript
// ❌ Trả về raw Prisma object — có thể rất lớn
return await this.songRepo.findAll();  // bao gồm encrypted tokens, internal fields

// ✅ DTO với @Expose — kiểm soát chính xác field nào ra
return plainToInstance(SongResponseDto, songs, { excludeExtraneousValues: true });
```

**Field selection ở DB layer** (tốt hơn nếu cần):
```typescript
// Thay vì lấy toàn object rồi loại field
const songs = await this.songRepo.findMany({
  select: {
    id: true,
    title: true,
    url: true,
    // Không select: internalNotes, processingMetadata, etc.
  }
});
```

### HTTP Compression

```typescript
// main.ts — gzip tất cả response > 1KB
app.use(compression({
  level: 6,          // balance giữa CPU cost và compression ratio
  threshold: 1024,   // chỉ compress file > 1KB
}));
```

---

## Bức Tranh Lớn: Thứ Tự Tối Ưu

```
1. [ARCHITECTURE] Async/sync split
   → Tác vụ nặng đi queue, không block HTTP
   
2. [BUSINESS LOGIC] Idempotency / dedup
   → Tránh làm việc thừa từ đầu

3. [DATABASE] Index đúng access pattern
   → Query O(log n) thay vì O(n)

4. [MEMORY] Stream thay vì buffer
   → Không OOM với file lớn

5. [NETWORK] Parallel queries thay vì sequential
   → Latency = max(queries), không phải sum

6. [CACHE] Cache data semi-static
   → Giảm tải DB cho read-heavy endpoints

7. [QUEUE] Cap concurrency theo resource constraint
   → Tránh OOM và CPU thrashing

8. [LOGGING] Log level và structured logging
   → Observability không sacrifice performance
```

**Bước 1-3 có impact lớn nhất** — thường là 10x-100x improvement.
**Bước 4-6 có impact vừa** — thường là 2x-10x.
**Bước 7-8 là fine-tuning** — thường là <2x nhưng quan trọng cho stability.

---

## Anti-Patterns Hay Gặp

| Anti-Pattern | Vấn đề | Fix |
|-------------|--------|-----|
| Fetch toàn collection, filter ở app | O(n) fetch, filter ở JS | WHERE clause và index ở DB |
| Log ở debug level mọi thứ | CPU + I/O overhead | Warn level production, structured log |
| Retry ngay lập tức khi fail | Retry storm → khuếch đại failure | Exponential backoff + jitter |
| Buffer file lớn vào RAM | OOM với concurrent users | Stream |
| Sequential queries cho data độc lập | Latency cộng dồn | Promise.all() |
| Không cap pagination | 1 request query toàn DB | Math.min(limit, MAX_LIMIT) |
| Cache JWT validation | Revoked token vẫn có quyền | Không cache auth-critical data |
| Tăng concurrency để "nhanh hơn" | CPU thrash + OOM | Match concurrency với CPU cores |
