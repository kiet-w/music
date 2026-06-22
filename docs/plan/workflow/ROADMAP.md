# Roadmap & Technical Debt

## Phase 1 — Core Foundation ✅ (Hoàn thành)

- [x] NestJS project setup với Prisma + PostgreSQL
- [x] JWT Authentication (register/login)
- [x] Google OAuth login
- [x] Album CRUD với default album auto-create
- [x] Song/Track CRUD
- [x] YouTube download qua yt-dlp
- [x] BullMQ queue (concurrency: 2, retry + backoff)
- [x] Supabase Storage integration (stream upload)
- [x] Track Reuse mechanism (dedup by sourceId)
- [x] BaseRepository pattern với Prisma error mapping
- [x] AllExceptionsFilter (RFC 7807)
- [x] ValidationPipe (whitelist + forbidNonWhitelisted)
- [x] LoggingInterceptor (pino)

## Phase 2 — Production Features ✅ (Hoàn thành)

- [x] CORS fail-closed
- [x] Rate limiting (ThrottlerModule)
- [x] AES-256-GCM encryption cho Google tokens
- [x] Lazy token migration (backward compat)
- [x] SSRF protection (dual-layer URL validation)
- [x] RBAC (Admin role + RolesGuard)
- [x] Google Drive OAuth + import
- [x] P2P messaging
- [x] Friend request system (token-based)
- [x] CleanupService (stuck jobs + orphaned temp files)
- [x] Prometheus metrics (`http_request_duration_seconds`)
- [x] Sentry error tracking
- [x] Docker Compose production stack
- [x] Caddy reverse proxy (auto TLS)
- [x] Grafana + Loki + Promtail monitoring
- [x] Daily PostgreSQL backup
- [x] Env validation schema (Joi)

## Phase 3 — Enhancement 🔄 (Đang / Chưa làm)

- [ ] Frontend hoàn chỉnh (~70% hiện tại)
- [ ] WebSocket / SSE cho realtime job status
  - Hiện tại: client phải poll `GET /songs/:id`
  - Target: `WebSocketGateway` hoặc SSE push khi job done
- [ ] `/health/ready` endpoint (check DB + Redis connectivity)
  - Hiện tại: chỉ có `/health` (liveness)
  - K8s cần readiness probe riêng
- [ ] Integration tests với test containers
  - Hiện tại: unit tests với mocks
  - Target: real DB tests cho repository layer
- [ ] Admin dashboard UI
- [ ] Search tracks/albums (full-text search)
- [ ] Playlist feature (nhiều albums trong 1 playlist)

## Phase 4 — Scale & Advanced 📋 (Backlog)

- [ ] Outbox Pattern cho guaranteed job enqueue
  - Hiện tại: known gap — crash giữa INSERT và queue.add()
  - Target: ghi OutboxEvent trong cùng DB transaction
- [ ] Redis-backed CacheModule (thay in-memory)
  - Hiện tại: in-memory cache → không đồng bộ khi scale multi-instance
  - Target: `cache-manager` với `@keyv/redis` store
- [ ] Idempotency-Key header cho song creation
  - Target: client retry safe (không tạo duplicate)
- [ ] Horizontal scaling (multi-instance)
  - Cần: Redis cache, sticky sessions hoặc stateless JWT
- [ ] CDN cho Supabase assets
- [ ] Audio transcoding quality options (128/192/320 kbps)
- [ ] Offline mode (Capacitor + service worker)
- [ ] AI integration (tương lai: music recommendation)

---

## Technical Debt — Ưu Tiên Cao

### 1. Known Gap: Crash giữa INSERT và queue.add()
**File**: `src/songs/song.service.ts:83-97`
**Vấn đề**: Nếu server crash sau `songRepository.create()` nhưng trước `conversionQueue.add()`, Track record tồn tại trong DB với `url: ''` nhưng không có job. CleanupService không phát hiện được vì không có DownloadJob record stuck.
**Giải pháp**: Outbox Pattern — ghi event vào OutboxEvent table trong cùng transaction với Track create, worker riêng xử lý.
**Priority**: Medium (throughput hiện tại thấp, risk chấp nhận được)

### 2. In-Memory Cache không đồng bộ
**File**: `src/app.module.ts:72-75`
**Vấn đề**: `CacheModule.register({ isGlobal: true })` dùng in-memory. Khi scale ≥ 2 instances, mỗi instance có cache riêng → invalidation trên instance A không ảnh hưởng instance B.
**Giải pháp**: Switch sang `@keyv/redis` store (chú ý: `cache-manager` v5+ dùng API mới).
**Priority**: High (nếu plan scale)

### 3. Missing `/health/ready` Endpoint
**File**: `src/core/app.controller.ts`
**Vấn đề**: Chỉ có `/health` (liveness). K8s readiness probe cần endpoint check DB + Redis connectivity.
**Giải pháp**: Thêm `GET /health/ready` gọi `prisma.$queryRaw\`SELECT 1\`` và `redisClient.ping()`.
**Priority**: High (nếu deploy K8s)

---

## Technical Debt — Ưu Tiên Trung Bình

### 4. No Realtime Job Status
**Vấn đề**: Client phải poll `GET /songs/:id` để biết download xong chưa.
**Giải pháp**: BullMQ emit events → WebSocket gateway push status update.
**Complexity**: Medium

### 5. No Integration Tests
**Vấn đề**: Chỉ có unit tests với mocks. Repository layer có thể có bugs trong query logic phức tạp.
**Giải pháp**: Jest + `@testcontainers/postgresql` cho real DB tests.
**Complexity**: Medium

### 6. yt-dlp Binary Bundled
**Vấn đề**: `backend/yt-dlp` binary không được auto-update. Có thể bị YouTube block sau update format.
**Giải pháp**: Download binary trong Dockerfile từ GitHub releases, pin version.
**Priority**: Medium

---

## Technical Debt — Ưu Tiên Thấp

### 7. No API Versioning
**Vấn đề**: Breaking API changes sẽ ảnh hưởng tất cả client.
**Giải pháp**: URL prefix versioning (`/api/v1/`, `/api/v2/`).

### 8. Missing Request ID Propagation
**Vấn đề**: Log không có `requestId` xuyên suốt từ HTTP → BullMQ → worker.
**Giải pháp**: Generate UUID trong interceptor, pass vào job payload, attach vào tất cả logs trong job.

### 9. No Response Compression
**Vấn đề**: Large list responses không được compress.
**Giải pháp**: `app.use(compression())` trong main.ts.

---

## Known Issues & Limitations

| Issue | Severity | Workaround |
|-------|----------|-----------|
| yt-dlp có thể bị YouTube block (format changes) | High | Update yt-dlp binary định kỳ |
| Google token refresh tự động không có retry | Medium | User re-authenticate nếu refresh fail |
| Supabase public URL không thay đổi nếu file bị xóa thủ công | Low | Track URL sẽ 404 nhưng không có alert |
| Import Google Drive không bọc trong transaction | Medium | Zombie file nếu DB write fail sau upload |
| Concurrent download limit 2 không configurable qua env | Low | Hard-coded trong processor |

---

## Version History

| Version | Ngày | Thay đổi |
|---------|------|---------|
| v1.0.0 | — | Core: auth, album, song, YouTube download |
| v1.1.0 | — | Google Drive integration |
| v1.2.0 | — | BullMQ queue, stream upload, track reuse |
| v1.3.0 | — | Messaging, friend requests |
| v1.4.0 | — | Security hardening (AES-256-GCM, SSRF, CORS fail-closed) |
| v1.5.0 | — | Prometheus metrics, Sentry, Grafana + Loki stack |
| v1.6.0 | — | Admin module, CleanupService cron |