# Database Schema — ERD & Chi Tiết Models

## ERD Diagram (ASCII)

```
┌─────────────────────┐
│        User         │
│─────────────────────│
│ id          UUID PK │◄──────────────────────────────────────────┐
│ email       String  │                                           │
│ passwordHash String?│                                           │
│ googleId    String? │                                           │
│ googleAccess String?│  (encrypted AES-256-GCM)                 │
│ googleRefresh String?│ (encrypted AES-256-GCM)                 │
│ googleTokenExpiry   │                                           │
│ name        String? │                                           │
│ role        UserRole│ (USER | ADMIN)                            │
│ createdAt   DateTime│                                           │
│ updatedAt   DateTime│                                           │
└──────┬──────────────┘                                           │
       │ 1                                                        │
       │                                                          │
  ┌────┼──────────────────────────────────────────────────┐      │
  │    │                                                   │      │
  ▼    ▼                                                   ▼      │
┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐ │
│    Album     │    │ DownloadJob  │    │      Message         │ │
│──────────────│    │──────────────│    │──────────────────────│ │
│ id     UUID  │    │ id     UUID  │    │ id        UUID       │ │
│ title  String│    │ url    String│    │ content   String     │ │
│ artist String│    │ status JobSts│    │ senderId  UUID FK──►─┤ │
│ coverUrl Str │    │ progress Int │    │ receiverId UUID FK──►┤ │
│ isDefault Bl │    │ errorMsg Str?│    │ createdAt DateTime   │ │
│ userId UUID FK────►│ downloadUrl │    └──────────────────────┘ │
│ createdAt    │    │ userId UUID FK────────────────────────────►┘│
└───────┬──────┘    │ createdAt    │    ┌──────────────────────┐  │
        │ 1         │ updatedAt    │    │   FriendRequest      │  │
        │           └──────────────┘    │──────────────────────│  │
        ▼                               │ id        UUID       │  │
┌───────────────┐                       │ token     String UNQ │  │
│     Track     │                       │ senderId  UUID FK──►─┤  │
│───────────────│                       │ receiverId UUID FK?─►┤  │
│ id    UUID PK │                       │ status    ReqStatus  │  │
│ title  String │                       │ expiresAt DateTime   │  │
│ artist String?│                       │ createdAt DateTime   │  │
│ url    String │  (Supabase public URL)│ updatedAt DateTime   │  │
│ duration Int? │                       └──────────────────────┘  │
│ albumId UUID FK───►Album.id                                      │
│ userId  UUID FK────────────────────────────────────────────────►─┘
│ sourceType Str?│  ('youtube' | 'google-drive')
│ sourceId   Str?│  (YouTube video ID hoặc Drive file ID)
│ createdAt  Dt  │
└────────────────┘
```

---

## Chi Tiết Từng Model

### `User`

| Column | Type | Nullable | Default | Ghi chú |
|--------|------|----------|---------|---------|
| `id` | String (UUID) | No | `uuid()` | PK |
| `email` | String | No | — | UNIQUE |
| `passwordHash` | String | Yes | — | Null nếu Google-only account |
| `googleId` | String | Yes | — | UNIQUE, null nếu email/password |
| `googleAccessToken` | String | Yes | — | **Encrypted AES-256-GCM** |
| `googleRefreshToken` | String | Yes | — | **Encrypted AES-256-GCM** |
| `googleTokenExpiry` | DateTime | Yes | — | |
| `name` | String | Yes | — | |
| `role` | UserRole | No | `USER` | Enum: USER, ADMIN |
| `createdAt` | DateTime | No | `now()` | |
| `updatedAt` | DateTime | No | — | Auto-update |

**Relations**: `albums[]`, `tracks[]`, `sentMessages[]`, `receivedMessages[]`, `sentRequests[]`, `receivedRequests[]`, `downloadJobs[]`

---

### `Album`

| Column | Type | Nullable | Default | Ghi chú |
|--------|------|----------|---------|---------|
| `id` | String (UUID) | No | `uuid()` | PK |
| `title` | String | No | — | |
| `artist` | String | Yes | — | |
| `coverUrl` | String | Yes | — | |
| `isDefault` | Boolean | No | `false` | Tối đa 1 default album per user |
| `userId` | String | No | — | FK → User.id (Cascade delete) |
| `createdAt` | DateTime | No | `now()` | |

**Indexes**:
- `@@index([userId])` — lookup tất cả album của user
- `@@index([userId, isDefault])` — filter default album

**Business Rule**: Khi user đăng nhập lần đầu, `AlbumService.findOrCreateDefault()` tạo album mặc định. Race condition được xử lý bằng optimistic create + catch P2002.

---

### `Track`

| Column | Type | Nullable | Default | Ghi chú |
|--------|------|----------|---------|---------|
| `id` | String (UUID) | No | `uuid()` | PK |
| `title` | String | No | — | |
| `artist` | String | Yes | — | |
| `url` | String | No | — | Supabase public URL. Rỗng (`''`) khi đang processing |
| `duration` | Int | Yes | — | Tính bằng giây |
| `albumId` | String | No | — | FK → Album.id (Cascade delete) |
| `userId` | String | No | — | FK → User.id (Cascade delete). **Denormalized** — không cần join Album |
| `sourceType` | String | Yes | — | `'youtube'` hoặc `'google-drive'` |
| `sourceId` | String | Yes | — | YouTube video ID hoặc Drive file ID. Dùng để dedup |
| `createdAt` | DateTime | No | `now()` | |

**Indexes**:
- `@@index([albumId])`
- `@@index([userId])` — lookup trực tiếp, bypass join Album

**Track Reuse Logic**: Trước khi download, `SongService` check xem `sourceId` đã tồn tại trong DB chưa. Nếu có → reuse URL Supabase, không download lại.

---

### `Message`

| Column | Type | Nullable | Default | Ghi chú |
|--------|------|----------|---------|---------|
| `id` | String (UUID) | No | `uuid()` | PK |
| `content` | String | No | — | |
| `senderId` | String | No | — | FK → User.id (Cascade delete) |
| `receiverId` | String | No | — | FK → User.id (Cascade delete) |
| `createdAt` | DateTime | No | `now()` | |

**Indexes**:
- `@@index([senderId])`
- `@@index([receiverId])`
- `@@index([senderId, receiverId])` — conversation query 2 chiều

---

### `FriendRequest`

| Column | Type | Nullable | Default | Ghi chú |
|--------|------|----------|---------|---------|
| `id` | String (UUID) | No | `uuid()` | PK |
| `token` | String | No | — | UNIQUE. Dùng trong link mời |
| `senderId` | String | No | — | FK → User.id (Cascade delete) |
| `receiverId` | String | Yes | — | Null khi chưa có người nhận |
| `status` | RequestStatus | No | `PENDING` | Enum: PENDING, ACCEPTED, REJECTED, EXPIRED |
| `expiresAt` | DateTime | No | — | |
| `createdAt` | DateTime | No | `now()` | |
| `updatedAt` | DateTime | No | — | |

**Indexes**:
- `@@index([senderId])`
- `@@index([token])` — lookup by invite link token

---

### `DownloadJob`

| Column | Type | Nullable | Default | Ghi chú |
|--------|------|----------|---------|---------|
| `id` | String (UUID) | No | `uuid()` | PK |
| `url` | String | No | — | YouTube URL gốc |
| `status` | JobStatus | No | `PENDING` | Enum: PENDING, PROCESSING, COMPLETED, FAILED |
| `progress` | Int | No | `0` | 0-100 |
| `errorMessage` | String | Yes | — | Lý do thất bại |
| `downloadUrl` | String | Yes | — | Supabase URL sau khi xong |
| `userId` | String | No | — | FK → User.id (Cascade delete) |
| `createdAt` | DateTime | No | `now()` | |
| `updatedAt` | DateTime | No | — | |

**Indexes**:
- `@@index([userId])`
- `@@index([status])` — CleanupService query jobs stuck > 2h

---

## Enums

```prisma
enum UserRole {
  USER
  ADMIN
}

enum RequestStatus {
  PENDING
  ACCEPTED
  REJECTED
  EXPIRED
}

enum JobStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

---

## Quan Trọng: Dual URL Config (Prisma)

```
DATABASE_URL   ← dùng qua pgbouncer (connection pooling) cho runtime queries
DIRECT_URL     ← kết nối trực tiếp, chỉ dùng cho prisma migrate
```

Tại sao cần 2 URL: pgbouncer không hỗ trợ prepared statements mà Prisma migrate dùng.

---

## SQL Query Patterns Quan Trọng

### 1. Tất cả tracks của user (không cần JOIN Album)
```sql
SELECT * FROM "Track"
WHERE "userId" = $1
ORDER BY "createdAt" DESC
LIMIT 50 OFFSET 0;
-- Dùng index Track_userId_idx
```

### 2. Default album của user
```sql
SELECT * FROM "Album"
WHERE "userId" = $1 AND "isDefault" = true
LIMIT 1;
-- Dùng compound index Album_userId_isDefault_idx
```

### 3. Check track reuse (YouTube dedup)
```sql
SELECT * FROM "Track"
WHERE "sourceType" = 'youtube'
  AND "sourceId" = $1
  AND "url" != ''
LIMIT 1;
```

### 4. Tìm stuck jobs (CleanupService)
```sql
SELECT * FROM "DownloadJob"
WHERE "status" IN ('PENDING', 'PROCESSING')
  AND "createdAt" < NOW() - INTERVAL '2 hours';
-- Dùng index DownloadJob_status_idx
```

### 5. Conversation query (2 chiều)
```sql
SELECT * FROM "Message"
WHERE ("senderId" = $1 AND "receiverId" = $2)
   OR ("senderId" = $2 AND "receiverId" = $1)
ORDER BY "createdAt" ASC;
-- Dùng compound index Message_senderId_receiverId_idx
```

### 6. Đếm tracks trong album
```sql
-- Prisma _count (không fetch data)
SELECT COUNT(*) FROM "Track" WHERE "albumId" = $1;
```

---

## Migration History

Migrations nằm trong `backend/prisma/migrations/`.

```bash
# Tạo migration mới
npx prisma migrate dev --name <tên>

# Apply production
npx prisma migrate deploy

# Reset (chỉ dev)
npx prisma migrate reset
```

> ⚠️ Khi thêm column NOT NULL vào bảng có data thật, phải có `DEFAULT` hoặc dùng migration 2 bước:
> 1. Thêm column nullable
> 2. Backfill data
> 3. Set NOT NULL constraint