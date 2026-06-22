# Music App — Project Overview

## Mục Tiêu Dự Án

Ứng dụng nghe nhạc cá nhân hóa cho phép người dùng:
- Tải nhạc từ YouTube dưới dạng MP3 (thông qua yt-dlp)
- Quản lý thư viện cá nhân: album, track, playlist
- Đồng bộ và import nhạc từ Google Drive
- Chat P2P giữa các người dùng
- Hệ thống kết bạn (Friend Request)

---

## Tech Stack (thực tế trong code)

| Layer | Technology |
|-------|-----------|
| **Backend Framework** | NestJS (Node.js) |
| **ORM** | Prisma |
| **Database** | PostgreSQL |
| **Queue** | BullMQ (Redis-backed) |
| **Cache** | NestJS CacheModule (in-memory, 60s TTL) |
| **Auth** | JWT + Google OAuth2 |
| **Storage** | Supabase Storage |
| **Download** | yt-dlp (binary bundled tại `backend/yt-dlp`) |
| **Encryption** | AES-256-GCM (cho Google tokens) |
| **Logger** | nestjs-pino + pino-pretty (dev) |
| **Metrics** | Prometheus (`@willsoto/nestjs-prometheus`) |
| **Error Tracking** | Sentry |
| **API Docs** | Swagger (dev only, tắt ở production) |
| **Frontend** | Next.js (thư mục `frontend/`) |
| **Reverse Proxy** | Caddy (auto TLS) |
| **Monitoring** | Prometheus + Grafana + Loki + Promtail |

---

## Cấu Trúc Thư Mục

```
music/
├── backend/                    # NestJS API server
│   ├── src/
│   │   ├── admin/             # Admin module (ADMIN role only)
│   │   ├── albums/            # Album CRUD
│   │   ├── auth/              # JWT, Google OAuth, RBAC
│   │   ├── common/            # Shared: filters, interceptors, logger, validators
│   │   ├── config/            # Env validation schema (Joi)
│   │   ├── core/              # AppController (health check)
│   │   ├── downloader/        # yt-dlp wrapper service
│   │   ├── google-drive/      # Google Drive OAuth + import
│   │   ├── jobs/              # BullMQ processor + cleanup + metrics
│   │   ├── messages/          # P2P messaging
│   │   ├── prisma/            # PrismaService
│   │   ├── songs/             # Song CRUD + YouTube download logic
│   │   ├── storage/           # Supabase storage abstraction
│   │   ├── app.module.ts      # Root module
│   │   └── main.ts            # Bootstrap (CORS fail-closed, Sentry, Swagger)
│   ├── prisma/
│   │   └── schema.prisma      # 6 models: User, Album, Track, Message, FriendRequest, DownloadJob
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                   # Next.js app
├── docs/plan/                  # Tài liệu (bạn đang đọc file này)
├── docker-compose.yml          # Dev
├── docker-compose.prod.yml     # Production (Caddy, Redis, monitoring stack)
├── Caddyfile                   # Reverse proxy config
├── prometheus.yml              # Metrics scrape config
├── loki-config.yml             # Log aggregation
├── promtail-config.yml         # Log shipper
└── .env.example                # Template biến môi trường
```

---

## Modules Backend

| Module | Chức năng | Controller |
|--------|----------|-----------|
| `AuthModule` | Register/Login/Google OAuth/JWT/RBAC | `AuthController` |
| `SongsModule` | YouTube download, Track CRUD, reuse logic | `SongController` |
| `AlbumsModule` | Album CRUD, default album auto-create | `AlbumController` |
| `GoogleDriveModule` | Drive OAuth, list files, import | `GoogleDriveController`, `MusicController` |
| `JobsModule` | BullMQ processor, cleanup cron, metrics | — (processor) |
| `MessagesModule` | P2P messaging, friend requests | `MessagesController`, `FriendRequestsController` |
| `AdminModule` | Xóa track, cleanup storage (ADMIN only) | `AdminController` |
| `StorageModule` | Supabase upload/download abstraction | — (service) |
| `DownloaderModule` | yt-dlp wrapper | — (service) |
| `PrismaModule` | Database client | — (service) |

---

## Trạng Thái Hoàn Thiện

| Phần | Trạng thái | Ghi chú |
|------|-----------|---------|
| Auth (JWT + Google) | ✅ Hoàn chỉnh | Bao gồm lazy token migration AES-256-GCM |
| Album CRUD | ✅ Hoàn chỉnh | Default album auto-create với race condition handling |
| Song/Track CRUD | ✅ Hoàn chỉnh | Bao gồm Track Reuse mechanism |
| YouTube Download | ✅ Hoàn chỉnh | yt-dlp → Supabase stream (không buffer) |
| Google Drive Import | ✅ Hoàn chỉnh | OAuth + list files + import |
| BullMQ Queue | ✅ Hoàn chỉnh | concurrency: 2, retry 3 lần, exponential backoff |
| Cleanup Cron | ✅ Hoàn chỉnh | Xử lý stuck jobs và orphaned files |
| P2P Messaging | ✅ Hoàn chỉnh | |
| Friend Requests | ✅ Hoàn chỉnh | Token-based, có expiry |
| Admin Panel | ✅ Hoàn chỉnh | Delete track, cleanup storage |
| Prometheus Metrics | ✅ Hoàn chỉnh | `http_request_duration_seconds` histogram |
| Sentry Error Tracking | ✅ Hoàn chỉnh | Tự động trong main.ts |
| Swagger Docs | ✅ Dev only | Tắt ở production |
| Frontend (Next.js) | 🔄 ~70% | |
| Testing | 🔄 Unit tests có, integration tests chưa |

---

## Template .env Đầy Đủ

```bash
# ── Backend ───────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://dbuser:password@db:5432/music_db?schema=public&pgbouncer=false
DIRECT_URL=postgresql://dbuser:password@db:5432/music_db?schema=public
PORT=4000
JWT_SECRET=your_jwt_secret_minimum_32_chars
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=your_32_byte_hex_key_for_aes256gcm

# CORS — fail-closed: app crash nếu không có biến này
CORS_ORIGINS=https://yourdomain.com

# Google OAuth (cho Google Login + Google Drive)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/callback/google

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_service_role_key

# Redis (BullMQ)
REDIS_HOST=redis
REDIS_PORT=6379

# ── Frontend ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# ── Infrastructure ────────────────────────────────────────────────────────────
DOMAIN=yourdomain.com

# ── Sentry ────────────────────────────────────────────────────────────────────
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project

# ── Monitoring (Grafana) ──────────────────────────────────────────────────────
GRAFANA_USER=admin
GRAFANA_PASSWORD=changeme_in_production

# ── Database Backup ───────────────────────────────────────────────────────────
DB_HOST=db
DB_NAME=music_db
DB_USER=dbuser
DB_PASSWORD=password
```