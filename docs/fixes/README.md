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
| [2026-07-22-messages-pagination-production.md](./2026-07-22-messages-pagination-production.md) | 22/07/2026 | Frontend | Fixed chat pagination, keyboard layout shift & message reactivity |
| [2026-07-23-production-readiness-security-fixes.md](./2026-07-23-production-readiness-security-fixes.md) | 23/07/2026 | Frontend | Remediation of critical security, build errors, testing & hardcoded URLs |

## Quy ước đặt tên file

```
YYYY-MM-DD-<phạm-vi>-<mô-tả-ngắn>.md
```

Ví dụ:
- `2026-07-05-backend-auth.md`
- `2026-07-06-frontend-routing.md`
- `2026-07-07-docker-networking.md`
