# Download Flow — Luồng Xử Lý YouTube & Google Drive

## 1. YouTube Download Flow (Full Detail)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CLIENT                                                                      │
│  POST /songs/youtube                                                         │
│  Headers: Authorization: Bearer <jwt>                                        │
│  Body: { url, title, artist?, albumId? }                                    │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: Guards & Middleware                                                │
│                                                                              │
│  1. ThrottlerGuard: 10 req/phút per IP                                      │
│     └─ POST /songs/youtube có @Throttle riêng (nếu config)                  │
│  2. JwtAuthGuard: validate Bearer token                                      │
│     └─ Extract userId từ payload                                             │
│  3. ValidationPipe: validate CreateSongYoutubeDto                           │
│     ├─ url: @IsYouTubeUrl() (custom validator)                               │
│     ├─ title: @IsString() @IsNotEmpty()                                      │
│     └─ albumId?: @IsUUID()                                                   │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │  Nếu validation fail → 400 Bad Request
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 2: SongController.createFromYoutube()                                 │
│  Gọi: SongService.createFromYoutube(userId, url, title, artist, albumId)    │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 3: SongService — Business Logic                                       │
│                                                                              │
│  Step A: Album Resolution                                                    │
│  ├─ Nếu albumId được cung cấp:                                               │
│  │    └─ albumRepository.findUnique({ id: albumId })                        │
│  │       ├─ Không tồn tại hoặc userId không khớp → 404                      │
│  │       └─ Ok → dùng albumId                                               │
│  └─ Nếu không có albumId:                                                   │
│       └─ AlbumService.findOrCreateDefault(userId)                           │
│            ├─ findFirst({ userId, isDefault: true })                        │
│            └─ Nếu không có: CREATE mới (optimistic, xử lý P2002 race)      │
│                                                                              │
│  Step B: ── TRACK REUSE CHECK ──────────────────────────────────────────── │
│  ├─ extractYoutubeId(url) → "dQw4w9WgXcQ" (11 chars)                       │
│  ├─ songRepository.findFirst({                                               │
│  │    sourceType: 'youtube', sourceId: youtubeId, url: { not: '' }          │
│  │  })                                                                       │
│  ├─ [HIT] Track đã tồn tại với URL Supabase:                                │
│  │    └─ CREATE new Track record với url = existingTrack.url                │
│  │    └─ Return 201 ngay (không enqueue job)                                 │
│  │                                                                           │
│  └─ [MISS] Track chưa tồn tại:                                              │
│       └─ Tiếp tục Step C                                                    │
│                                                                              │
│  Step C: CREATE placeholder Track record                                     │
│  ├─ songRepository.create({                                                  │
│  │    title, artist, url: '',   ← URL rỗng = đang xử lý                     │
│  │    albumId, userId, sourceType: 'youtube', sourceId                       │
│  │  })                                                                       │
│  │                                                                           │
│  Step D: ENQUEUE BullMQ Job                                                  │
│  ├─ conversionQueue.add('convert', { url, songId: song.id, userId })        │
│  └─ attempts: 3, backoff: { type: 'exponential', delay: 5000 }              │
│                                                                              │
│  Step E: Return 201 ngay (không đợi download xong)                          │
│  └─ SongResponseDto { id, title, artist, url: '', albumId, ... }            │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │  Response 201 về client
                               │
                               │  (Async — song song với response về client)
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 4: ConversionProcessor (BullMQ Worker)                                │
│  @Processor('conversion', { concurrency: 2 })                               │
│                                                                              │
│  Step 1: Prepare temp directory                                              │
│  ├─ path: process.cwd()/temp/{songId}.mp3                                   │
│  └─ mkdir -p temp/ nếu chưa có                                              │
│                                                                              │
│  Step 2: Download từ YouTube (yt-dlp)                                        │
│  ├─ DownloaderService.download(url, outputPath)                              │
│  ├─ SSRF check: validate URL là YouTube domain trước khi spawn               │
│  ├─ Spawn: ./yt-dlp --extract-audio --audio-format mp3 -o {outputPath}      │
│  └─ Throw error nếu exit code != 0 (error classification từ stderr)         │
│                                                                              │
│  Step 3: Upload lên Supabase (STREAM — không buffer)                        │
│  ├─ fs.createReadStream(outputPath)                                          │
│  ├─ storageService.uploadStream(fileStream, 'music', 'songs/{songId}.mp3')  │
│  └─ Memory footprint: chỉ 1 chunk (~64KB) tại một thời điểm                │
│                                                                              │
│  Step 4: Get Public URL                                                      │
│  └─ storageService.getPublicUrl('music', 'songs/{songId}.mp3')              │
│                                                                              │
│  Step 5: Update Database                                                     │
│  └─ prisma.track.update({ where: { id: songId }, data: { url: publicUrl } })│
│                                                                              │
│  Step 6: Cleanup temp file (FINALLY BLOCK — chạy dù success hay fail)       │
│  └─ downloaderService.cleanup(outputPath)                                    │
│                                                                              │
│  On Error:                                                                   │
│  ├─ cleanup(outputPath) ← temp file không bao giờ bị leak                  │
│  ├─ throw error → BullMQ retry (exponential backoff)                         │
│  └─ Sau 3 lần fail → job vào Dead Letter Queue                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Track Reuse Mechanism

```
User A download "Never Gonna Give You Up" (dQw4w9WgXcQ)
  → Download + upload → Track record { sourceId: "dQw4w9WgXcQ", url: "supabase.co/music/songA.mp3" }

User B paste cùng link
  → SongService check: sourceId "dQw4w9WgXcQ" đã có url không rỗng?
  → YES → Tạo Track record MỚI cho User B nhưng url = "supabase.co/music/songA.mp3"
  → KHÔNG enqueue job, không download, không tốn bandwidth/storage
  → Return 201 ngay lập tức (~20ms thay vì 60s)
```

**Lợi ích**:
- Tiết kiệm Supabase storage quota
- Không download trùng lặp
- Response nhanh hơn đáng kể cho popular tracks

---

## 3. Google Drive Import Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Bước 1: User kết nối Google Drive (lần đầu)                                │
│                                                                              │
│  GET /google-drive/auth-url                                                  │
│    └─ GoogleDriveService.generateAuthUrl(userId)                             │
│         └─ Google OAuth URL với scope: drive.readonly                        │
│                                                                              │
│  [User click URL, Google redirect với ?code=...]                             │
│                                                                              │
│  POST /google-drive/exchange-code { code, state }                            │
│    └─ GoogleDriveService.exchangeCodeForTokens(userId, code, state)          │
│         ├─ Validate state (CSRF protection)                                  │
│         ├─ Exchange code → { access_token, refresh_token }                   │
│         └─ Encrypt tokens (AES-256-GCM) → save to DB                        │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  Bước 2: List files từ Drive                                                 │
│                                                                              │
│  GET /google-drive/files                                                     │
│    └─ GoogleDriveService.listFiles(userId)                                   │
│         ├─ Decrypt access_token từ DB                                        │
│         ├─ Nếu token expired: refresh tự động                                │
│         └─ Google Drive API: list files với MIME type audio/*               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  Bước 3: Import file                                                         │
│                                                                              │
│  POST /google-drive/import { fileId, albumId? }                              │
│    └─ GoogleDriveService.importFile(userId, { fileId, albumId })             │
│         ├─ Resolve albumId (tương tự YouTube flow)                           │
│         ├─ Download stream từ Google Drive                                   │
│         ├─ uploadStream → Supabase (pipe trực tiếp, không disk)             │
│         └─ CREATE Track record với sourceType: 'google-drive'                │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Google Drive Status Cache

```
GET /google-drive/status
  ├─ Check cache: key = "gdrive-status-{userId}"
  ├─ [HIT] Return { connected: true/false } từ cache (5 phút TTL)
  └─ [MISS]
       ├─ GoogleDriveService.isConnected(userId) → query DB
       ├─ cacheManager.set(cacheKey, connected, 300_000) ← 5 phút
       └─ Return { connected }

Invalidation:
  ├─ Khi user disconnect Drive: cacheManager.del(`gdrive-status-${userId}`)
  └─ TTL tự expire sau 5 phút
```

---

## 5. CleanupService — Self-Healing Mechanism

```
@Cron(CronExpression.EVERY_HOUR)
async cleanupStuckJobs():
  ├─ Find DownloadJobs WHERE status IN (PENDING, PROCESSING)
  │    AND createdAt < NOW() - 2h
  └─ Mark as FAILED + log

@Cron(CronExpression.EVERY_HOUR)
async cleanupOrphanedTempFiles():
  └─ Scan /temp/*.mp3 WHERE mtime < NOW() - 1h
       └─ Delete file

⚠️ Known Limitation:
  CleanupService giải quyết "job stuck" (đã vào queue, worker crash giữa đường).
  Nó KHÔNG giải quyết "job không bao giờ được enqueue" (server crash sau INSERT
  track nhưng trước queue.add()). Đây là known gap — giải pháp đúng là Outbox
  Pattern nhưng chưa implement vì throughput hiện tại không yêu cầu.
```

---

## 6. Retry Strategy (BullMQ)

```typescript
conversionQueue.add('convert', jobData, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,  // 1st retry: 5s, 2nd: 10s, 3rd: 20s
  },
});

// Concurrency: 2 (CPU-bound task — yt-dlp + ffmpeg)
// Lý do không đặt cao hơn:
//   - 2 ffmpeg processes × ~50MB RAM = ~100MB
//   - CPU context switch overhead nếu cao hơn core count
//   - OOM risk với large files ở concurrency cao
@Processor('conversion', { concurrency: 2 })
```