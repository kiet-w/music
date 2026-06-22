# Backend Architecture — Sơ Đồ Kiến Trúc Layered

## Sơ Đồ Tổng Thể (HTTP Client → PostgreSQL)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          HTTP Client / Frontend                      │
└───────────────────────────────┬─────────────────────────────────────┘
                                │  HTTPS (qua Caddy reverse proxy)
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        NestJS Bootstrap (main.ts)                    │
│  ├─ CORS fail-closed (crash nếu CORS_ORIGINS không có)              │
│  ├─ Sentry.init() — phải chạy trước tất cả                         │
│  ├─ ValidationPipe (whitelist: true, forbidNonWhitelisted: true)     │
│  ├─ AllExceptionsFilter — catch mọi lỗi, format RFC 7807            │
│  ├─ Swagger (dev only, tắt ở production)                            │
│  └─ listen(:4000)                                                    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Global Interceptors (thứ tự chạy)               │
│  1. HttpMetricsInterceptor — ghi Prometheus histogram               │
│  2. LoggingInterceptor — log request/response (pino)                │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           ThrottlerGuard                             │
│  10 requests/phút per IP (global), override cho sensitive endpoints  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Route Controllers                           │
│                                                                      │
│  AuthController      /auth/*                                        │
│  SongController      /songs/*                                       │
│  AlbumController     /albums/*                                      │
│  GoogleDriveCtrl     /google-drive/*                                │
│  MessagesController  /messages/*                                    │
│  FriendReqController /friend-requests/*                             │
│  AdminController     /admin/*                                       │
│  AppController       /health, /metrics                              │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                    ┌───────────▼──────────┐
                    │     Guards Layer      │
                    │  JwtAuthGuard         │
                    │  RolesGuard (ADMIN)   │
                    └───────────┬──────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Services Layer                              │
│                                                                      │
│  AuthService          ← Business logic auth, token, encryption      │
│  SongService          ← YouTube dedup, queue enqueue, CRUD          │
│  AlbumService         ← findOrCreateDefault (race condition safe)   │
│  GoogleDriveService   ← OAuth exchange, file listing, import        │
│  MessagesService      ← P2P messaging                               │
│  AdminService         ← Admin operations                            │
│  DownloaderService    ← yt-dlp wrapper + SSRF validation            │
│  StorageService       ← Supabase upload/stream/getPublicUrl         │
│  CleanupService       ← Cron: stuck jobs > 2h, orphan files > 1h   │
│  JobsMetricsService   ← BullMQ queue metrics cho Prometheus         │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                    ┌───────────▼──────────┐
                    │   Repository Layer    │
                    │  (BaseRepository)     │
                    │  SongRepository       │
                    │  AlbumRepository      │
                    └───────────┬──────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         PrismaService                                │
│  (extends PrismaClient, global module)                              │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  PostgreSQL Database   │
                    │  (via pgbouncer URL    │
                    │   + direct URL)        │
                    └───────────────────────┘

── Async Path (BullMQ) ──────────────────────────────────────────────
SongService.createFromYoutube()
    │
    ├─ INSERT Track (url: '') ← placeholder record
    │
    └─ conversionQueue.add('convert', { url, songId, userId })
                │
                ▼
        ┌──────────────┐     Redis (BullMQ)
        │ ConversionQ  │ ←─────────────────
        │ Processor    │   concurrency: 2
        │              │   retry: 3x exponential backoff 5s
        │  1. yt-dlp download → /temp/{songId}.mp3
        │  2. fs.createReadStream → Supabase uploadStream
        │  3. getPublicUrl
        │  4. prisma.track.update(url)
        │  5. cleanup temp file (finally block)
        └──────────────┘
```

---

## Module Dependency Map

```
AppModule
├── ConfigModule (global)         ← env validation via Joi
├── LoggerModule (pino, global)   ← structured JSON logs
├── CacheModule (global, 60s)     ← in-memory cache
├── ScheduleModule                ← @Cron decorators
├── ThrottlerModule               ← rate limiting
├── PrometheusModule              ← /metrics endpoint
│
├── PrismaModule (global)
│
├── AuthModule
│   ├── PrismaModule
│   └── JwtModule
│
├── SongsModule
│   ├── AlbumsModule
│   ├── BullModule (queue: 'conversion')
│   └── PrismaModule
│
├── AlbumsModule
│   └── PrismaModule
│
├── JobsModule
│   ├── BullModule (queue: 'conversion')
│   ├── DownloaderModule
│   ├── StorageModule
│   └── PrismaModule
│
├── GoogleDriveModule
│   ├── StorageModule
│   └── PrismaModule
│
├── MessagesModule
│   └── PrismaModule
│
├── AdminModule
│   ├── StorageModule
│   └── PrismaModule
│
├── StorageModule
└── DownloaderModule
```

---

## Guards

### `JwtAuthGuard` (`src/auth/jwt-auth.guard.ts`)
- Extend `AuthGuard('jwt')` từ `@nestjs/passport`
- Validate Bearer token trong header `Authorization`
- Inject `CurrentUser` vào request

### `RolesGuard` (`src/auth/guards/roles.guard.ts`)
- Kết hợp với `@Roles(UserRole.ADMIN)` decorator
- Check `user.role` từ JWT payload
- Dùng cho Admin endpoints

---

## Interceptors

### `HttpMetricsInterceptor` (`src/common/interceptors/http-metrics.interceptor.ts`)
- Inject `InjectMetric('http_request_duration_seconds')`
- Ghi histogram: `method`, `route`, `status_code`
- Chạy **trước** LoggingInterceptor (thứ tự trong AppModule)

### `LoggingInterceptor` (`src/common/interceptors/logging.interceptor.ts`)
- Log mỗi HTTP request với duration, method, URL, status
- Redact `Authorization` và `Cookie` header
- Level: `warn` production, `debug` development

---

## Exception Filter

### `AllExceptionsFilter` (`src/common/filters/all-exceptions.filter.ts`)
- Catch tất cả exception (Nest + non-Nest)
- Format response theo RFC 7807 Problem Details:
  ```json
  {
    "statusCode": 404,
    "error": "Not Found",
    "message": "Song not found",
    "timestamp": "2024-01-15T02:13:45.123Z",
    "path": "/songs/abc"
  }
  ```
- Report lên Sentry nếu là 5xx

---

## BaseRepository Pattern

File: `src/common/repositories/base.repository.ts`

Mọi repository (SongRepository, AlbumRepository) extend từ `BaseRepository<T>` generic.

**Tính năng**:
- Wrap tất cả Prisma operations trong try/catch
- Map lỗi Prisma → HTTP exceptions:
  - `P2002` (Unique constraint) → `409 ConflictException`
  - `P2025` (Record not found) → `404 NotFoundException`
  - Lỗi khác → re-throw (sẽ bị AllExceptionsFilter bắt)
- API: `findMany`, `findFirst`, `findUnique`, `create`, `update`, `delete`, `count`

```typescript
// Ví dụ race condition handling trong AlbumService
async findOrCreateDefault(userId: string): Promise<Album> {
  try {
    return await this.albumRepository.create({ data: { userId, isDefault: true } });
  } catch (error) {
    if (error instanceof ConflictException) {
      // P2002: default album đã tồn tại (race condition)
      return this.albumRepository.findFirst({ where: { userId, isDefault: true } });
    }
    throw error;
  }
}
```

---

## Logging Strategy

```
Development:
  pino-pretty → colorized, human-readable terminal output
  format: [HH:MM:ss] [context] message

Production:
  JSON structured logs → stdout
  Collected by Promtail → shipped to Loki → visualize in Grafana

Redaction:
  req.headers.authorization → [REDACTED]
  req.headers.cookie → [REDACTED]

Log Levels:
  production: 'warn' (chỉ warn + error)
  development: 'debug' (tất cả)

Secret Redaction (HTTP layer):
  LoggingInterceptor redact token fields
  pino logger: paths: ['req.headers.authorization', 'req.headers.cookie']
```

---

## Prometheus Metrics

Endpoint: `GET /metrics` (Prometheus scrape)

| Metric | Type | Labels |
|--------|------|--------|
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status_code` |

Buckets: `[0.01, 0.05, 0.1, 0.5, 1, 2, 5]` seconds

Config scrape trong `prometheus.yml`:
```yaml
scrape_configs:
  - job_name: 'nestjs-backend'
    static_configs:
      - targets: ['backend:4000']
    metrics_path: /metrics
```

Visualize trong Grafana (datasource: Prometheus + Loki).