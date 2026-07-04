# 📋 Fix Logs — Nhật ký Khắc phục Lỗi

Thư mục này chứa toàn bộ nhật ký các lỗi đã được phát hiện và khắc phục trong dự án.

## Cấu trúc

```
docs/fixes/
├── README.md                           ← File này
├── 2026-07-04-backend-setup.md         ← Fix #1: Backend infrastructure
└── 2026-07-04-frontend-performance.md  ← Fix #2: Frontend compile speed
```

## Danh sách Fix Logs

| File | Ngày | Phạm vi | Tóm tắt |
|------|------|---------|---------|
| [2026-07-04-backend-setup.md](./2026-07-04-backend-setup.md) | 04/07/2026 | Backend | Prisma URL, TypeScript types, ENCRYPTION_KEY, Redis, ffmpeg, yt-dlp |
| [2026-07-04-frontend-performance.md](./2026-07-04-frontend-performance.md) | 04/07/2026 | Frontend | Turbopack, Sentry dev overhead, compile optimization |

## Quy ước đặt tên file

```
YYYY-MM-DD-<phạm-vi>-<mô-tả-ngắn>.md
```

Ví dụ:
- `2026-07-05-backend-auth.md`
- `2026-07-06-frontend-routing.md`
- `2026-07-07-docker-networking.md`
