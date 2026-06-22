# INDEX — Tổng Quan Tài Liệu Học Từ learn.md

> File này là entry point — đọc file này trước, sau đó chọn phần bạn cần đi sâu.

---

## Nguồn Gốc

Tài liệu này được tạo từ [`backend/docs/plan/learn.md`](../../backend/docs/plan/learn.md) — phân tích chi tiết codebase Music App và các patterns production-grade đáng học.

---

## 8 File Tài Liệu Theo Chủ Đề

| # | File | Nội Dung | Đọc Khi Nào |
|---|------|----------|-------------|
| 01 | [learn-01-codebase-reading-guide.md](./learn-01-codebase-reading-guide.md) | Cách đọc codebase theo luồng request, không theo folder | Khi bắt đầu đọc project mới |
| 02 | [learn-02-interview-patterns.md](./learn-02-interview-patterns.md) | 4 câu chuyện STAR cho interview, phụ lục câu hỏi conceptual | Trước khi đi phỏng vấn |
| 03 | [learn-03-production-checklist.md](./learn-03-production-checklist.md) | 5 câu hỏi production-grade, self-review template | Trước khi nói code "done" |
| 04 | [learn-04-system-design-api-design.md](./learn-04-system-design-api-design.md) | Tư duy sync/async, database, REST conventions, distributed system | Khi thiết kế feature mới |
| 05 | [learn-05-performance-engineering.md](./learn-05-performance-engineering.md) | N+1 fix, stream vs buffer, cache patterns, redis, queue tuning | Khi optimize performance |
| 06 | [learn-06-security-patterns.md](./learn-06-security-patterns.md) | Defense in depth, AES-256-GCM, lazy token migration, OAuth state | Khi implement security feature |
| 07 | [learn-07-testing-patterns.md](./learn-07-testing-patterns.md) | Test pyramid, mock strategy, factory pattern, behavior testing | Khi setup automation tests |
| 08 | [learn-08-ai-agent-patterns.md](./learn-08-ai-agent-patterns.md) | Áp dụng pattern sang Project 1 (AI Agent): streaming, idempotency | Khi phỏng vấn vai trò AI Engineer |

---

## Quick Reference — Patterns Nhanh

### "Tôi đang viết feature mới, cần check gì?"

```
Trước khi code:
  □ Tác vụ mất >2s? → dùng queue (xem file 04)
  □ Có thể có request trùng? → plan idempotency (xem file 03)
  □ Nhận input từ user? → plan validation layers (xem file 06)

Sau khi code:
  □ 5 câu hỏi production (xem file 03)
  □ Security checklist cuối file 06
```

### "Tôi đang chuẩn bị interview, focus vào đâu?"

```
4 câu chuyện ưu tiên (xem file 02):
  1. JWT schema migration không gây mass logout
  2. Race condition default album (optimistic create)
  3. SSRF defense in depth (validate 2 lớp độc lập)
  4. Cleanup-on-failure (finally block + self-healing cron)
```

### "Tôi thấy app chậm, debug theo thứ tự nào?"

```
Thứ tự tối ưu (xem file 05):
  1. N+1 query? (eager loading, include)
  2. Sequential queries độc lập? (Promise.all)
  3. Thiếu index? (EXPLAIN ANALYZE)
  4. Buffer thay vì stream? (file operations)
  5. Missing cache? (read-heavy, semi-static data)
```

---

## Bức Tranh Hệ Thống Tổng Thể

```
┌──────────────────────────────────────────────────────────┐
│                     CLIENT                               │
│  - Global 401 interception → auto redirect login        │
│  - Token revocation sau khi dùng (Google OAuth)         │
│  - Offline storage guard (Capacitor vs web)             │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼───────────────────────────────────┐
│                  NEXT.JS BFF                             │
│  - Thin proxy pattern (forward to NestJS)               │
│  - Không có business logic ở đây                        │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│               NESTJS BACKEND                             │
│                                                          │
│  [Cross-cutting] LoggingInterceptor + AllExceptionsFilter│
│  [Auth] JwtAuthGuard → RolesGuard                       │
│  [Rate limit] ThrottlerModule                           │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ FAST PATH (HTTP layer)                          │    │
│  │ • Validate → Check cache → Write DB → Enqueue  │    │
│  │ • Return 202 trong <100ms                       │    │
│  └─────────────────────────────────────────────────┘    │
│                       │                                  │
│              BullMQ Queue                                │
│                       │                                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │ SLOW PATH (Worker)                              │    │
│  │ • Download (yt-dlp/Google Drive)                │    │
│  │ • Transcode (128kbps MP3)                       │    │
│  │ • Stream upload → Supabase                      │    │
│  │ • Update DB status                              │    │
│  │ • Cleanup temp files (always)                   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  [Cron] CleanupService — self-healing mỗi giờ           │
└──────────────────────┬───────────────────────────────────┘
                       │
          ┌────────────┼─────────────┐
          ▼            ▼             ▼
     PostgreSQL      Redis       Supabase
   (Prisma + index)  (Cache +   (File storage
                      Queue)     streaming)
```

---

## Số Liệu Đáng Nhớ

| Quyết định | Impact |
|-----------|--------|
| 128kbps vs 320kbps | File size giảm 60%, upload nhanh 2.5x |
| Stream vs buffer | RAM không phụ thuộc file size |
| Parallel vs sequential queries | Latency = max, không phải sum |
| Idempotent YouTube dedup | Hit: vài ms vs Miss: 10-60s |
| Exponential backoff | Tránh retry storm khi service recover |
| concurrency: 2 | Tránh OOM và CPU thrash trên VPS nhỏ |

---

## Nguồn Học Thêm (Bổ Sung Ngoài learn.md)

**Database**:
- [Use The Index Luke](https://use-the-index-luke.com/) — B-tree index, composite index
- [Prisma Performance Guide](https://www.prisma.io/docs/guides/performance-and-optimization)

**System Design**:
- *Designing Data-Intensive Applications* — Martin Kleppmann (quyển kinh điển)
- [System Design Primer](https://github.com/donnemartin/system-design-primer) — GitHub

**Security**:
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — 10 lỗ hổng phổ biến nhất
- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)

**NestJS-specific**:
- [NestJS Security docs](https://docs.nestjs.com/security/authentication)
- [BullMQ Best Practices](https://docs.bullmq.io/guide/best-practices)

**Interview Prep**:
- *System Design Interview* — Alex Xu (Vol 1 & 2)
- [ByteByteGo](https://bytebytego.com/) — diagrams cho system design concepts
