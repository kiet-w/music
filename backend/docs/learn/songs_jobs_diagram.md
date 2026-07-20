# Songs & Jobs Module — Architecture Diagram

> Dựa trên: `backend/docs/learn/songs/` + `backend/docs/learn/jobs/`

---

## 1. Toàn cảnh hệ thống

```mermaid
graph TB
    subgraph CLIENT["🌐 Client / Browser"]
        REQ["HTTP Request\nPOST /songs/youtube"]
    end

    subgraph SONGS_MODULE["📦 SongsModule"]
        CTRL["SongsController\n@JwtAuthGuard + @ThrottlerGuard\n@UseInterceptors(ClassSerializerInterceptor)"]
        SVC["SongsService\n(Business Logic)"]
        REPO["SongRepository\nextends BaseRepository&lt;Track&gt;"]
        BASE["BaseRepository&lt;T, Delegate&gt;\nhandlePrismaError(P2002/P2025/P2003)"]
        ALBUM_HELPER["AlbumValidationHelper"]
        INTERCEPTOR["LoggingInterceptor\n✅ log thành công / ❌ log lỗi\nredact() sensitive fields"]
    end

    subgraph JOBS_MODULE["⚙️ JobsModule"]
        BULL_CONFIG["BullModule.forRoot\nRedis connection + TLS auto-detect"]
        QUEUE["Queue: 'conversion'\nattempts:3, backoff: exponential 5s"]
        PROCESSOR["ConversionProcessor\n@Processor concurrency:2"]
        DOWNLOADER["DownloaderService\nyt-dlp binary"]
        STORAGE["StorageService\nSupabase Storage"]
        CLEANUP["CleanupService\n@Cron EVERY_HOUR"]
        METRICS["JobsMetricsService\n@Cron EVERY_10_SECONDS"]
    end

    subgraph INFRA["🏗️ Infrastructure"]
        REDIS[("Redis\nJob Queue Storage")]
        DB[("PostgreSQL / Prisma\ntrack table")]
        SUPABASE[("Supabase Storage\nbucket: music")]
        PROMETHEUS["Prometheus\nGauge Metrics"]
    end

    REQ --> INTERCEPTOR --> CTRL
    CTRL --> SVC
    SVC --> REPO --> BASE --> DB
    SVC --> ALBUM_HELPER
    SVC -->|"Queue.add('convert',...)"| QUEUE
    QUEUE <--> REDIS
    REDIS --> PROCESSOR
    PROCESSOR --> DOWNLOADER
    PROCESSOR --> STORAGE
    PROCESSOR -->|"prisma.track.update(url)"| DB
    DOWNLOADER -->|"yt-dlp download"| SUPABASE
    STORAGE --> SUPABASE
    CLEANUP --> DB
    CLEANUP -->|"delete .mp3/.part"| DISK["💾 temp/ disk"]
    METRICS --> PROMETHEUS
    METRICS <-->|"getJobCounts()"| QUEUE
```

---

## 2. HTTP Request Flow — Songs Module

```mermaid
sequenceDiagram
    participant C as 🌐 Client
    participant LI as LoggingInterceptor
    participant CTRL as SongsController
    participant SVC as SongsService
    participant REPO as SongRepository
    participant Q as BullMQ Queue

    C->>LI: POST /songs/youtube {url, albumId}
    Note over LI: Ghi lại method, url, userId (8 ký tự đầu)
    LI->>CTRL: forward request
    Note over CTRL: JwtAuthGuard → xác thực JWT<br/>ThrottlerGuard → max 10 req/60s<br/>@CurrentUser() → lấy userId
    CTRL->>SVC: createFromYoutube(userId, dto)

    SVC->>SVC: validateAlbum(albumId)
    SVC->>SVC: extractYoutubeId(url)

    rect rgb(255, 240, 200)
        Note over SVC,REPO: Deduplication 3 tầng
        SVC->>REPO: findByYoutubeId(youtubeId)
        alt Tầng 1: Đã có bài convert xong (url != '')
            REPO-->>SVC: existingTrack
            SVC->>REPO: create({url: existingTrack.url, ...})
            SVC-->>CTRL: SongResponseDto (reuse URL)
        else Tầng 2: Có bài đang pending (url == '')
            SVC->>REPO: findPendingByYoutubeId(youtubeId)
            REPO-->>SVC: pendingTrack
            SVC->>REPO: create({url: '', sourceId: youtubeId})
            SVC-->>CTRL: SongResponseDto (chờ job của track kia)
        else Tầng 3: Chưa có gì
            SVC->>REPO: create({url: '', ...})
            REPO-->>SVC: newSong
            SVC->>REPO: findPendingByYoutubeId (race check)
            alt Thua race: có người khác tạo trước
                SVC->>REPO: delete(newSong.id)
                SVC-->>CTRL: SongResponseDto (từ người thắng)
            else Thắng race
                SVC->>Q: add('convert', {url, songId, userId}, {jobId: 'convert-'+youtubeId})
                SVC-->>CTRL: SongResponseDto (pending)
            end
        end
    end

    CTRL-->>LI: response
    LI->>LI: log ✅/❌ + duration
    LI-->>C: HTTP 201 {song object}
```

---

## 3. ConversionProcessor Flow — Jobs Module

```mermaid
flowchart TD
    START([Job picked up from Redis]) --> LOG1[appLogger.startSection]
    LOG1 --> MKTEMP[Tạo temp dir nếu chưa có\noutputPath = temp/songId.mp3]
    MKTEMP --> DL["DownloaderService.download(url, outputPath)\n⏳ yt-dlp → 30-120 giây"]

    DL --> |"Success"| STREAM["fs.createReadStream(outputPath)\n→ StorageService.uploadStream(stream, 'music', 'songs/songId.mp3')\n✅ Constant memory ~64KB"]

    DL --> |"Fail"| ERR1[cleanup temp file]
    ERR1 --> RETHROW1[throw error → BullMQ retry]

    STREAM --> |"Success"| GETURL["StorageService.getPublicUrl('music', storagePath)\n→ publicUrl = https://supabase..."]
    STREAM --> |"Fail"| ERR2[cleanup temp file]
    ERR2 --> RETHROW2[throw error → BullMQ retry]

    GETURL --> UPDATEDB["prisma.track.update\nurl: '' → url: publicUrl\n⚠️ Bước này CUỐI CÙNG: chỉ update khi chắc file đã lên cloud"]
    UPDATEDB --> CLEANUP[downloaderService.cleanup\nxóa temp/songId.mp3]
    CLEANUP --> LOG2[appLogger.endSection]
    LOG2 --> DONE([Job: completed ✅])

    subgraph RETRY["🔄 Retry Logic"]
        RETHROW1 & RETHROW2 --> WAIT["BullMQ exponential backoff\nAttempt 1: immediate\nAttempt 2: +5s\nAttempt 3: +10s"]
        WAIT --> |"< 3 attempts"| START
        WAIT --> |">= 3 attempts"| FAILED([Job: failed ❌])
    end
```

---

## 4. CleanupService — Scheduled Tasks

```mermaid
flowchart LR
    CRON["@Cron EVERY_HOUR\n0 * * * *"] --> HANDLER[handleCron]
    
    HANDLER --> OJ[cleanupOrphanedJobs]
    HANDLER --> TF[cleanupTempFiles]

    OJ --> OJ_Q{"downloadJob\nstatus IN PROCESSING, PENDING\nAND updatedAt < 2h ago"}
    OJ_Q --> |"found"| OJ_U["updateMany → status: FAILED\nerrorMessage: 'Job timed out'"]
    OJ_Q --> |"none"| OJ_SKIP[skip]

    TF --> TF_SCAN["scan temp/ directory\nfilter: .mp3 and .part"]
    TF_SCAN --> TF_Q{"mtimeMs < 1h ago?"}
    TF_Q --> |"yes"| TF_DEL[fs.unlinkSync\nxóa file]
    TF_Q --> |"no"| TF_SKIP[skip]

    subgraph WHY["Tại sao cần 2 loại?"]
        W1["Loại 1: Job treo\n→ Server crash giữa chừng\n→ finally không chạy"]
        W2["Loại 2: File tạm\n→ kill -9 hoặc power cut\n→ cleanup() không chạy"]
    end
```

---

## 5. JobsMetricsService — Monitoring

```mermaid
flowchart LR
    CRON["@Cron EVERY_10_SECONDS"] --> UPDATE[updateMetrics]
    UPDATE --> COUNTS["queue.getJobCounts()\n'waiting', 'active', 'completed', 'failed'"]
    COUNTS --> G1["waitingGauge.set\nbullmq_queue_jobs_waiting"]
    COUNTS --> G2["activeGauge.set\nbullmq_queue_jobs_active"]
    COUNTS --> G3["completedGauge.set\nbullmq_queue_jobs_completed"]
    COUNTS --> G4["failedGauge.set\nbullmq_queue_jobs_failed"]
    G1 & G2 & G3 & G4 --> PROM["Prometheus /metrics"]
```

---

## 6. Module Dependencies

```mermaid
graph LR
    subgraph APP["AppModule"]
        AM[AppModule]
    end

    subgraph SM["SongsModule"]
        SC[SongsController]
        SS[SongsService]
        SR[SongRepository]
        AVH[AlbumValidationHelper]
    end

    subgraph JM["JobsModule"]
        JMod[JobsModule]
        CP[ConversionProcessor]
        CS[CleanupService]
        JMS[JobsMetricsService]
        Bull[BullModule\n'conversion' queue]
    end

    subgraph AlbM["AlbumsModule"]
        AlbRepo[AlbumRepository]
        AlbSvc[AlbumService]
    end

    SM -->|"imports"| JM
    SM -->|"imports"| AlbM
    JM -->|"exports BullModule"| SM
    AlbM -->|"exports AlbumRepository + AlbumService"| SM

    SS -->|"@InjectQueue('conversion')"| Bull
    CP -->|uses| DownloaderModule
    CP -->|uses| StorageModule
    SM -->|"exports SongRepository"| AdminModule["AdminModule (cross-module query)"]
```

---

## 7. Database State Machine — Track.url

```mermaid
stateDiagram-v2
    [*] --> PENDING: SongsService.createFromYoutube()\ncreate({url: ''})

    PENDING --> PROCESSING: ConversionProcessor picks up job
    PROCESSING --> COMPLETED: prisma.track.update({url: publicUrl})
    PROCESSING --> FAILED_RETRY: Error thrown → BullMQ retry
    FAILED_RETRY --> PROCESSING: Retry attempt (max 3)
    FAILED_RETRY --> FAILED: Max attempts reached
    FAILED --> CLEANED: CleanupService.cleanupOrphanedJobs()\n> 2h stuck → status=FAILED

    note right of PENDING: url = '' convention\nthay vì cột status riêng
    note right of COMPLETED: url = 'https://supabase...'\nClient có thể play ngay
```

---

## 8. SongRepository — Query Methods

```mermaid
classDiagram
    class BaseRepository~T, Delegate~ {
        +handlePrismaError(error) never
        +findMany(args) T[]
        +findFirst(args) T|null
        +findUnique(args) T|null
        +create(args) T
        +update(args) T
        +delete(args) T
        +count(args) number
        -P2002 → 409 ConflictException
        -P2025 → 404 NotFoundException
        -P2003 → 400 BadRequestException
    }

    class SongRepository {
        +findByYoutubeId(youtubeId) Track|null
        +findPendingByYoutubeId(youtubeId) Track|null
        +findByUserAndId(userId, id) Track|null
        +findAllByUser(userId, skip, take, orderBy, where) Track[]
        +countByUser(userId) number
        -All queries: include album:true
    }

    BaseRepository <|-- SongRepository
    SongRepository --> PrismaService

    note for SongRepository "findByYoutubeId: url != ''  (done)\nfindPendingByYoutubeId: url == '' (pending)\nfindByUserAndId: filter userId → security 404"
```

---

## 9. Key Patterns Summary

| Pattern | File | Mục đích |
|---|---|---|
| **Deduplication 3 tầng** | `songs.service.ts` | 1 YouTube URL = 1 job, dù N user request |
| **`url = ''` là pending state** | Toàn module | Tránh thêm cột `status` |
| **Race condition check** | `songs.service.ts` | Tạo record → kiểm tra lại → nếu thua race thì xóa |
| **jobId: `convert-{youtubeId}`** | `songs.service.ts` | BullMQ dedup job level |
| **Streaming upload** | `conversion.processor.ts` | Memory ~64KB bất kể file size |
| **DB update là bước CUỐI** | `conversion.processor.ts` | Consistency: chỉ done khi file đã lên cloud |
| **Promise.all** | `songs.service.ts` | count + findMany chạy song song |
| **Security 404 thay 403** | `songs.service.ts` | Không lộ resource của user khác |
| **BaseRepository generic** | `base.repository.ts` | DRY: xử lý Prisma error 1 lần |
| **CleanupService dual** | `cleanup.service.ts` | Guard 2: dọn orphan job + temp files khi server crash |
| **Prometheus gauge** | `jobs.metrics.ts` | Real-time queue health monitoring |
| **concurrency: 2** | `conversion.processor.ts` | Balance speed vs resource (yt-dlp CPU-heavy) |
