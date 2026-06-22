# System Design & API Design — Thiết Kế Đúng Từ Đầu

> **Nguyên tắc**: System design không phải là "vẽ diagram đẹp" — là **trả lời những câu hỏi đúng trước khi viết code**. API design không phải là "đặt tên endpoint đẹp" — là **thiết kế contract đúng cho client và server**.

---

## Phần I — System Design: Tư Duy "Fast Path vs Slow Path"

### Quyết Định Quan Trọng Nhất: Tách Sync và Async

Trước khi thiết kế bất kỳ feature nào, hỏi: **"Tác vụ này mất bao lâu?"**

```
< 100ms   → Sync (HTTP request-response bình thường)
100ms-2s  → Sync nhưng cần timeout và error handling tốt
> 2s      → Async (queue-based), HTTP return ngay status 202
```

**Diagram tư duy**:
```
Client
  │
  ├─→ POST /songs/youtube
  │       │
  │       ├── [FAST PATH — HTTP Layer]
  │       │   Validate input        (~1ms)
  │       │   Check cache/dedup     (~5ms)
  │       │   INSERT pending record (~10ms)
  │       │   Enqueue job           (~5ms)
  │       └── return 202 { jobId } (~21ms total)
  │
  │   [SLOW PATH — Worker Layer]
  │   DownloadYouTube               (10-60s)
  │   TranscodeAudio                (5-30s)
  │   UploadToStorage               (5-20s)
  │   UpdateTrackStatus             (~10ms)
  │
  └─→ GET /songs/:id                (polling hoặc WebSocket notify)
         return { status: 'DONE', url: ... }
```

**Tại sao quan trọng**:
- HTTP timeout thường 30-60s — nếu processing lâu hơn, client timeout
- Worker tier có thể scale độc lập với API tier
- Worker fail không ảnh hưởng HTTP availability
- Retry logic dễ implement ở queue level

---

### Các Quyết Định Database Quan Trọng

#### 1. Index Theo Access Pattern, Không Theo "Cảm Tính Chuẩn Hóa"

**Sai lầm phổ biến**: Tạo index theo primary/foreign key vì "chuẩn" — bỏ qua việc query thực tế dùng gì.

**Cách đúng**: Nhìn vào từng query trong code, hỏi "query này filter theo field nào?"

```sql
-- Query này:
SELECT * FROM "Track" WHERE "userId" = $1 ORDER BY "createdAt" DESC

-- Cần index này:
CREATE INDEX "Track_userId_createdAt_idx" ON "Track"("userId", "createdAt" DESC);
-- Không phải chỉ "Track_userId_idx" vì ORDER BY sẽ filesort nếu thiếu createdAt
```

**Index trong project và tại sao**:

| Index | Query dùng | Tại sao compound? |
|-------|-----------|-------------------|
| `Album_userId_isDefault_idx` | `WHERE userId=? AND isDefault=true` | Filter cả 2 cùng lúc — 1 index lookup thay vì 2 |
| `Message_senderId_receiverId_idx` | `WHERE senderId=? OR receiverId=?` | Conversation query 2 hướng — index hỗ trợ cả 2 |
| `Track_userId_idx` | `WHERE userId=?` | Bypass join qua Album — direct lookup |
| `DownloadJob_status_idx` | `WHERE status IN (...)` | Cron cleanup query, chạy mỗi giờ |

#### 2. Denormalization Có Chủ Đích

**Bài toán cổ điển**:
```
User → Album → Track (3NF chuẩn)

Để lấy "tất cả track của user":
SELECT t.* FROM Track t 
JOIN Album a ON t.albumId = a.id 
WHERE a.userId = ?
```

**Sau khi denormalize**:
```
Track.userId (thêm direct relation)

Query rút xuống:
SELECT * FROM Track WHERE userId = ?
```

**Khi nào nên denormalize**:
- Query này là access pattern phổ biến nhất (>50% queries)
- Join cost cao (nhiều record)
- Consistency requirement thấp (userId không đổi sau khi track được tạo)

**Khi nào KHÔNG nên denormalize**:
- Data thay đổi thường xuyên (phải update nhiều chỗ)
- Consistency quan trọng (risk desync giữa các bảng)
- Query không thực sự hot

#### 3. COUNT và Aggregate — Để DB Làm Thay Vì App

```typescript
// ❌ Fetch rồi đếm bằng JS — nếu album có 10,000 tracks, fetch hết về RAM
const tracks = await trackRepo.findMany({ where: { albumId } });
const count = tracks.length;

// ✅ Để DB COUNT — chỉ trả về 1 số, không transfer data
const count = await trackRepo.count({ where: { albumId } });
// Hoặc dùng Prisma _count
const album = await albumRepo.findOne({
  where: { id: albumId },
  include: { _count: { select: { tracks: true } } }
});
```

---

### Pagination — 3 Kiểu, Chọn Đúng Cho Từng Use Case

#### Offset Pagination (project đang dùng)

```typescript
const [total, items] = await Promise.all([
  repo.count({ where }),
  repo.findMany({ where, skip: offset, take: limit }),
]);
```

**Ưu**: Dễ implement, user có thể nhảy thẳng đến trang X.
**Nhược**: Khi data thay đổi giữa 2 page request, có thể bị skip item hoặc duplicate.
**Dùng khi**: Admin list, static-ish data, cần total count để hiện "X/Y kết quả".

#### Cursor Pagination

```typescript
const items = await repo.findMany({
  where,
  take: limit,
  cursor: { id: lastSeenId },
  skip: 1,  // skip cursor item itself
  orderBy: { createdAt: 'desc' },
});
const nextCursor = items[items.length - 1]?.id;
```

**Ưu**: Stable kể cả khi data thay đổi, performance tốt hơn với large offset.
**Nhược**: Không thể nhảy trang, không biết total.
**Dùng khi**: Infinite scroll, real-time feed, news feed.

#### Cap Pagination (bắt buộc dù dùng kiểu nào)

```typescript
// ❌ Tin client
const limit = parseInt(req.query.limit);

// ✅ Cap cứng
const limit = Math.min(parseInt(req.query.limit ?? '50', 10), 100);
```

Không có cap → attacker gửi `?limit=999999` → DB query khổng lồ → slow query → ảnh hưởng mọi user khác.

---

## Phần II — API Design: Thiết Kế Contract Đúng

### REST API Conventions Quan Trọng

#### HTTP Status Codes Đúng Nghĩa

| Status | Dùng khi | Không dùng khi |
|--------|----------|----------------|
| 200 OK | GET success, PUT update success | POST tạo resource mới |
| 201 Created | POST tạo resource mới thành công | Update |
| 202 Accepted | Async job được nhận, chưa xử lý | Job đã xong |
| 204 No Content | DELETE success | Khi có response body |
| 400 Bad Request | Input validation fail | Auth fail |
| 401 Unauthorized | Không có/invalid token | Có token nhưng không đủ quyền |
| 403 Forbidden | Token valid nhưng không đủ quyền | Token invalid |
| 404 Not Found | Resource không tồn tại | Input validation fail |
| 409 Conflict | Duplicate create (unique constraint) | Generic error |
| 422 Unprocessable Entity | Semantically invalid input | Syntax error |
| 429 Too Many Requests | Rate limit hit | Generic server error |
| 500 Internal Server Error | Unexpected server error | Client error |

**Tại sao phân biệt 401 vs 403 quan trọng**:
- 401: "Tôi không biết bạn là ai" → Client nên redirect to login
- 403: "Tôi biết bạn là ai nhưng bạn không được làm điều này" → Client nên show "Access denied"

#### Response Shape Nhất Quán

```typescript
// ✅ Success response
{
  data: { ... },          // actual payload
  meta: {                  // pagination, etc
    total: 100,
    page: 1,
    limit: 20,
  }
}

// ✅ Error response (RFC 7807 Problem Details)
{
  statusCode: 404,
  error: "Not Found",
  message: "Track with ID 'abc' not found",
  timestamp: "2024-01-15T02:13:45.123Z",
  path: "/songs/abc",
}

// ❌ Inconsistent — mỗi endpoint trả format khác
{ success: true, result: { ... } }  // endpoint A
{ ok: true, data: { ... } }          // endpoint B
{ track: { ... } }                   // endpoint C
```

#### Naming Conventions

```
GET    /songs              → list songs (plural resource)
POST   /songs              → create song
GET    /songs/:id          → get one song
PATCH  /songs/:id          → partial update
PUT    /songs/:id          → full replace
DELETE /songs/:id          → delete

GET    /songs/:id/album    → nested resource (album của song)
POST   /songs/youtube      → action (không phải resource CRUD)
POST   /auth/login         → action
```

---

### DTO Design — Validation Là Contract, Không Phải Optional

#### Input DTO (Request)

```typescript
export class CreateSongFromYoutubeDto {
  @IsString()
  @IsNotEmpty()
  @IsYouTubeUrl()            // custom validator — business rule
  url: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  albumId?: string;          // optional với semantic rõ ràng

  @IsOptional()
  @IsString()
  @MaxLength(100)            // cap length — defense against large payload
  customTitle?: string;
}
```

**Rules cho Input DTO**:
- Mọi field đều có validator (`@IsString`, `@IsInt`, etc.) — không bao giờ nhận unknown type
- Có `@MaxLength`/`@Max` cho string và number — không tin client gửi reasonable value
- Custom validator cho business rules (URL format, enum membership)
- `@IsOptional()` phải đi kèm explicit semantic — optional nghĩa là gì khi không có?

#### Output DTO (Response)

```typescript
export class SongResponseDto {
  @Expose() id: string;
  @Expose() title: string;
  @Expose() url: string;
  @Expose() duration: number;
  @Expose() albumId: string;
  @Expose() createdAt: Date;
  // Không có: passwordHash, internalNotes, adminFlags, etc.
}

// Trong service
return plainToInstance(SongResponseDto, song, { 
  excludeExtraneousValues: true  // field không có @Expose bị loại bỏ
});
```

**Tại sao `excludeExtraneousValues: true`**:
- Schema DB thay đổi (thêm column `internalNotes`) → response tự động không include field mới
- Không cần update DTO mỗi khi DB thay đổi
- Security by default — whitelist thay vì blacklist

---

### Versioning API — Chuẩn Bị Cho Thay Đổi

**Khi nào cần versioning**:
- Thay đổi response shape (xóa field, đổi tên field, đổi type)
- Thay đổi behavior (endpoint trả 200 nay trả 202)
- Breaking change cho client hiện tại

**Các chiến lược versioning**:

| Chiến lược | Ví dụ | Ưu | Nhược |
|-----------|-------|-----|-------|
| URL prefix | `/api/v1/songs`, `/api/v2/songs` | Rõ ràng, dễ route | URL dài, khó cache |
| Header | `Accept: application/vnd.app.v2+json` | URL clean | Phức tạp hơn |
| Query param | `/songs?version=2` | Dễ test | Không cache tốt |

**Recommendation**: URL prefix cho public API, header cho internal API.

---

### Rate Limiting — Bảo Vệ Chính Mình

**Tại sao cần**:
- Prevent abuse (scraping, brute force)
- Fair use (một user không thể chiếm hết quota)
- Cost control (yt-dlp, external API calls tốn tiền)

**Pattern trong project** (ThrottlerModule):
```typescript
ThrottlerModule.forRoot([{
  ttl: 60000,     // 1 phút
  limit: 10,      // 10 request mỗi phút per IP
}])
```

**Granular rate limiting cho sensitive endpoints**:
```typescript
@UseGuards(ThrottlerGuard)
@Throttle({ default: { ttl: 60000, limit: 3 } })  // 3 lần mỗi phút
async login(@Body() dto: LoginDto) { ... }

@Throttle({ default: { ttl: 3600000, limit: 5 } })  // 5 lần mỗi giờ
async importFromYoutube(@Body() dto: YoutubeDto) { ... }
```

**Response headers khi rate limit**:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1705283625
Retry-After: 45  (khi bị throttle)
```

---

### Health Check — Endpoint Bắt Buộc Cho Production

```typescript
// /health — basic liveness (container đang chạy không)
@Get('health')
health() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}

// /health/ready — readiness (app sẵn sàng nhận traffic không)
@Get('health/ready')
async ready() {
  const checks = await Promise.allSettled([
    this.prismaService.$queryRaw`SELECT 1`,    // DB connected?
    this.redisService.ping(),                    // Redis connected?
  ]);
  
  const dbOk = checks[0].status === 'fulfilled';
  const redisOk = checks[1].status === 'fulfilled';
  
  if (!dbOk || !redisOk) {
    throw new ServiceUnavailableException({
      status: 'not_ready',
      checks: { db: dbOk, redis: redisOk }
    });
  }
  
  return { status: 'ready', checks: { db: true, redis: true } };
}
```

**Tại sao cần cả 2**:
- **Liveness** (`/health`): Container restart nếu fail → chỉ check app process còn sống
- **Readiness** (`/health/ready`): Load balancer không route traffic nếu fail → check dependencies
- Không để K8s/load balancer gọi `/health/ready` với database call nặng mỗi giây — cache kết quả 10s

---

## Bức Tranh Lớn: Thứ Tự Ưu Tiên Khi Thiết Kế

```
1. Tách sync/async đúng chỗ
   └── Tác vụ > 2s → queue, không block HTTP

2. Idempotency ở business logic
   └── Check natural key trước khi create

3. Index theo access pattern thật
   └── Nhìn vào WHERE clause của từng query

4. Stream cho data lớn
   └── File, LLM response, external API response

5. Cap mọi input từ client
   └── pagination limit, rate limit, file size limit

6. Contract rõ ràng (status codes, response shape)
   └── Client biết chính xác handle gì ở mỗi trường hợp

[Sau cùng mới nghĩ đến]
7. Cache kỹ thuật (Redis TTL)
8. Tinh chỉnh concurrency
```

Những thứ ở cuối dễ thêm sau. Những thứ ở đầu nếu thiết kế sai từ đầu — rất khó sửa khi đã có data thật và user thật.
