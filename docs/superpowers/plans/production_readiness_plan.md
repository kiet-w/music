# 🎯 Production Readiness Remediation Plan — Music App

> **Ngày lập**: 2026-06-22 | **Codebase**: `/home/baudui/Projects/project/music`
> **Trạng thái hiện tại**: ❌ Chưa sẵn sàng deploy end-to-end
> **Mục tiêu**: Hệ thống production-ready, nhất quán, bảo mật

---

## 📊 Tổng quan kiến trúc hiện tại (thực tế từ codegraph)

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js :3000)                                       │
│  ├── /src/lib/api.ts  → gọi NEXT_PUBLIC_API_URL (:4000) [OK]   │
│  └── /[locale]/youtube/page.tsx → gọi HARDCODE :8001 [❌ BUG]  │
├─────────────────────────────────────────────────────────────────┤
│  Backend NestJS (:4000)                          [production-   │
│  ├── SongService.createFromYoutube()              grade]        │
│  │   └── BullMQ queue "conversion"                             │
│  └── ConversionProcessor → DownloaderService                   │
├─────────────────────────────────────────────────────────────────┤
│  music-ai-service FastAPI (:8001)                [❌ no auth]   │
│  ├── POST /youtube/convert  ← dummy user_id                    │
│  ├── GET  /youtube/status/:job_id                              │
│  └── Dramatiq worker → YouTubeService → StorageService         │
└─────────────────────────────────────────────────────────────────┘
```

**Vấn đề cốt lõi**: Hai pipeline YouTube song song, không sync schema, frontend gọi cả hai.

---

## 🔴 PHASE 1 — Critical Blockers (Phải xong trước deploy)
**Estimated effort**: 2–3 ngày

---

### P1-1: Quyết định và hợp nhất kiến trúc YouTube conversion

**Vấn đề**: Hai implementation tồn tại song song:
- [SongService.createFromYoutube()](file:///home/baudui/Projects/project/music/backend/src/songs/song.service.ts#L22) → BullMQ → [ConversionProcessor](file:///home/baudui/Projects/project/music/backend/src/jobs/conversion.processor.ts) → DownloaderService (NestJS)
- [youtube/page.tsx](file:///home/baudui/Projects/project/music/frontend/src/app/%5Blocale%5D/youtube/page.tsx) → `http://localhost:8001/youtube/convert` (Python/Dramatiq)

**Quyết định khuyến nghị**: **Giữ NestJS pipeline làm nguồn sự thật**, archive/xóa route Python vì:
- NestJS pipeline đã có: auth guard, userId scoping, sourceId cache hit, BullMQ retry
- Python service thiếu auth/CORS hoàn toàn

**Action items**:

#### Bước 1.1 — Xóa/ẩn route Python trong frontend
```diff
// frontend/src/app/[locale]/youtube/page.tsx
- // TOÀN BỘ FILE — redirect hoặc xóa route này
+ // Redirect tới /[locale]/downloader thay vì gọi thẳng :8001
```
File cần sửa: [youtube/page.tsx](file:///home/baudui/Projects/project/music/frontend/src/app/%5Blocale%5D/youtube/page.tsx)

#### Bước 1.2 — Cập nhật frontend api.ts gọi đúng endpoint NestJS
```typescript
// frontend/src/lib/api.ts — hàm downloadFromYoutube() đã đúng:
export async function downloadFromYoutube(appToken, url, title, artist?, albumId?) {
  // ✅ gọi `${API_URL}/songs/youtube` — GIỮ NGUYÊN
}
```
File: [api.ts](file:///home/baudui/Projects/project/music/frontend/src/lib/api.ts#L63)

#### Bước 1.3 — Quyết định fate của music-ai-service
**Option A (khuyến nghị nhanh)**: Comment-out `music-ai-api` và `worker` trong [docker-compose.yml](file:///home/baudui/Projects/project/music/docker-compose.yml#L45) trước deploy, add `TODO: archive` comment.

**Option B**: Nếu muốn giữ Python service (vd: AI features tương lai), thực hiện P1-2 đầy đủ.

```yaml
# docker-compose.yml — Option A: tạm disable
# music-ai-api:  # DISABLED: pending architecture decision
#   build: ...
```

---

### P1-2: Hardening music-ai-service (nếu chọn giữ Python service)

**File chính**: [app/main.py](file:///home/baudui/Projects/project/music/music-ai-service/app/main.py), [routers/youtube.py](file:///home/baudui/Projects/project/music/music-ai-service/app/routers/youtube.py)

#### Bước 2.1 — Thêm CORS vào FastAPI
```python
# music-ai-service/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(title="Music AI Service")

# CORS — chỉ cho phép frontend domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,  # từ env, không hardcode
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)
```

#### Bước 2.2 — Thêm JWT verification dependency
```python
# music-ai-service/app/core/auth.py (file mới)
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
import jwt

security = HTTPBearer()

async def verify_jwt(token = Depends(security)):
    try:
        payload = jwt.decode(
            token.credentials,
            settings.JWT_SECRET,  # phải khớp với NestJS JWT_SECRET
            algorithms=["HS256"]
        )
        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

#### Bước 2.3 — Áp JWT guard vào convert endpoint
```python
# music-ai-service/app/routers/youtube.py
@router.post("/convert")
async def start_conversion(
    request: YoutubeConvertRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user = Depends(verify_jwt)  # ← thêm dependency này
):
    # Dùng current_user['sub'] thay vì request.user_id
    # Xóa field user_id khỏi YoutubeConvertRequest schema
    actual_user_id = current_user['sub']
    ...
```

#### Bước 2.4 — Thêm rate limiting
```python
# pip install slowapi
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@router.post("/convert")
@limiter.limit("5/minute")  # max 5 conversions/minute/IP
async def start_conversion(request: Request, ...):
    ...
```

#### Bước 2.5 — Cập nhật config.py để validate env bắt buộc
```python
# music-ai-service/app/core/config.py
class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "")
    ALLOWED_ORIGINS: list = os.getenv("ALLOWED_ORIGINS", "").split(",")
    MAX_VIDEO_DURATION_SEC: int = int(os.getenv("MAX_VIDEO_DURATION_SEC", "3600"))
    MAX_FILE_SIZE_BYTES: int = int(os.getenv("MAX_FILE_SIZE_BYTES", str(100 * 1024 * 1024)))
    
    def __post_init__(self):
        if not self.JWT_SECRET:
            raise RuntimeError("JWT_SECRET environment variable is required")
        if not self.DATABASE_URL:
            raise RuntimeError("DATABASE_URL environment variable is required")
```

---

### P1-3: Fix frontend dummy user_id và hardcoded localhost

**File**: [youtube/page.tsx](file:///home/baudui/Projects/project/music/frontend/src/app/%5Blocale%5D/youtube/page.tsx)

```diff
- body: JSON.stringify({ 
-   url,
-   user_id: '00000000-0000-0000-0000-000000000000' // Dummy user
- }),
```

**Nếu giữ route này** (chọn Option B), thay bằng:
```typescript
// Lấy token từ auth context
const { appToken } = useAuth(); // hook hiện có

const response = await fetch(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL}/youtube/convert`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${appToken}`
  },
  body: JSON.stringify({ url }), // user_id không còn cần thiết
});
```

---

### P1-4: Audit XSS Surface (JWT trong localStorage)

**Vấn đề**: JWT lưu trong `localStorage` — nếu XSS thành công, toàn bộ session bị đánh cắp.

**Checklist cần verify**:

| Điểm | File | Trạng thái |
|------|------|-----------|
| Album title render | frontend/src/app/[locale]/albums/ | Cần audit |
| Song title render | frontend/src/app/[locale]/tracks/ | Cần audit |
| Drive file name render | frontend/src/app/[locale]/drive/ | ⚠️ HIGH RISK — tên file từ Google Drive |
| User display name | frontend/src/components/ | Cần audit |
| Error message render | frontend/src/components/ | Cần audit |

**Action**: Grep toàn frontend cho `dangerouslySetInnerHTML` và raw `innerHTML`:
```bash
rtk grep "dangerouslySetInnerHTML\|innerHTML" /home/baudui/Projects/project/music/frontend/src
```

**Nếu tìm thấy**: Wrap bằng `DOMPurify.sanitize()` hoặc xóa `dangerouslySetInnerHTML`.

---

### P1-5: Google OAuth callback fragility

**File**: `frontend/src/app/api/auth/callback/google/page.tsx`

**Vấn đề**: Đọc `localStorage` để xác định locale trong server component — có thể fail khi `accessToken` null giữa redirect cycle.

**Fix**:
```typescript
// Thêm null check và fallback rõ ràng
const accessToken = typeof window !== 'undefined' 
  ? localStorage.getItem('access_token') 
  : null;

if (!accessToken) {
  // redirect tới /login với error param thay vì crash
  router.replace(`/${defaultLocale}/login?error=oauth_failed`);
  return;
}
```

---

## 🟠 PHASE 2 — High Priority (Nên xong trong sprint 1 sau deploy)
**Estimated effort**: 1–2 ngày

---

### [x] P2-1: AdminController — Thêm audit log

**File**: [backend/src/admin/admin.controller.ts](file:///home/baudui/Projects/project/music/backend/src/admin/admin.controller.ts)

Hiện tại `deleteTrack` và `cleanupStorage` chạy không có log ai đã xóa gì.

```typescript
// backend/src/admin/admin.controller.ts
@Delete('tracks/:id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async deleteTrack(
  @Param('id') id: string,
  @CurrentUser() user: AuthUser,  // ← thêm
) {
  this.logger.warn(
    { adminUserId: user.id, deletedTrackId: id, action: 'ADMIN_DELETE_TRACK' },
    'Admin deleted track',
  );
  return this.songRepository.delete({ where: { id } });
}

@Post('storage/cleanup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async cleanupStorage(@CurrentUser() user: AuthUser) {
  this.logger.warn(
    { adminUserId: user.id, action: 'ADMIN_STORAGE_CLEANUP' },
    'Admin triggered storage cleanup',
  );
  return this.storageCleanupService.cleanup();
}
```

---

### [x] P2-2: JWT Schema Migration — Force re-login plan

**Vấn đề**: [RolesGuard](file:///home/baudui/Projects/project/music/backend/src/auth/guards/roles.guard.ts) — JWT cũ không có field `role` sẽ bị deny truy cập admin route (fail-closed — tốt), nhưng user cũ sẽ bị "lock out" cho đến khi login lại.

**Action**: Thêm migration endpoint hoặc force re-login khi token thiếu `role`:
```typescript
// backend/src/auth/jwt.strategy.ts
validate(payload: JwtPayload) {
  // Nếu token cũ không có role, treat như USER (backward compat)
  return {
    ...payload,
    role: payload.role ?? UserRole.USER,  // fallback graceful
  };
}
```

---

### [x] P2-3: music-ai-service — Structured logging thay vì print()

**File**: [app/worker.py](file:///home/baudui/Projects/project/music/music-ai-service/app/worker.py)

```diff
- print(f"Job {job_id} completed successfully.")
- print(f"Job {job_id} failed: {str(e)}")
- print(f"Failed to update DB error state: {db_e}")

+ import logging
+ import structlog
+ logger = structlog.get_logger()
+ 
+ logger.info("job_completed", job_id=job_id)
+ logger.error("job_failed", job_id=job_id, error=str(e))
+ logger.critical("db_update_failed", job_id=job_id, error=str(db_e))
```

---

### [x] P2-4: music-ai-service — Dockerfile healthcheck

**File hiện tại**: [Dockerfile.api](file:///home/baudui/Projects/project/music/music-ai-service/Dockerfile.api) — không có HEALTHCHECK

```dockerfile
# music-ai-service/Dockerfile.api
FROM python:3.12-slim
...
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Worker healthcheck (`Dockerfile.worker`) — kiểm tra Dramatiq worker alive:
```dockerfile
HEALTHCHECK --interval=60s --timeout=10s --retries=3 \
  CMD dramatiq --help > /dev/null 2>&1 || exit 1
```

---

### [x] P2-5: Orphaned job cleanup — Cron sweep /tmp

**File**: [app/worker.py](file:///home/baudui/Projects/project/music/music-ai-service/app/worker.py)

Job bị kill giữa chừng (OOM/container restart) để lại `/tmp` rác.

```python
# Thêm vào worker.py: periodic cleanup task
@dramatiq.actor(periodic=periodiq.cron("0 * * * *"))  # mỗi giờ
def cleanup_orphaned_temp_dirs():
    """Sweep /tmp/tmp* directories older than 2 hours."""
    import glob, time
    cutoff = time.time() - 7200  # 2 hours
    for d in glob.glob('/tmp/tmp*'):
        if os.path.isdir(d) and os.path.getmtime(d) < cutoff:
            shutil.rmtree(d, ignore_errors=True)
            logger.info("cleaned_orphaned_dir", path=d)
```

---

### [x] P2-6: useOfflineStorage — Guard web platform

**File**: [frontend/src/hooks/useOfflineStorage.ts](file:///home/baudui/Projects/project/music/frontend/src/hooks/useOfflineStorage.ts)

Hiện tại load toàn bộ MP3 vào memory làm base64 trên web platform — OOM crash với file lớn.

```typescript
// useOfflineStorage.ts
import { Capacitor } from '@capacitor/core';

const downloadTrack = useCallback(async (trackId: string, url: string) => {
  // Guard: chỉ support offline trên native platform
  if (!Capacitor.isNativePlatform()) {
    console.warn('Offline storage only supported on native platforms');
    return false;
  }
  
  // ... existing Filesystem logic
}, []);
```

On web, hiển thị UI khác: "Offline mode chỉ khả dụng trên ứng dụng mobile".

---

## 🟡 PHASE 3 — Medium Priority (Sau launch, trong sprint 2)
**Estimated effort**: 2–3 ngày

---

### P3-1: Script bootstrap Admin user đầu tiên

**Vấn đề**: Không có cách nào tạo user ADMIN đầu tiên ngoài can thiệp DB thủ công.

```typescript
// backend/scripts/create-admin.ts (file mới)
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createFirstAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  
  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD env vars');
    process.exit(1);
  }
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Promote existing user
    await prisma.user.update({
      where: { email },
      data: { role: UserRole.ADMIN }
    });
    console.log(`✅ User ${email} promoted to ADMIN`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: { email, passwordHash, name: 'Admin', role: UserRole.ADMIN }
    });
    console.log(`✅ Admin user ${email} created`);
  }
  
  await prisma.$disconnect();
}

createFirstAdmin().catch(console.error);
```

```json
// backend/package.json — thêm script
{
  "scripts": {
    "bootstrap:admin": "ts-node scripts/create-admin.ts"
  }
}
```

**Usage**: `ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=SecurePass123! npm run bootstrap:admin`

---

### P3-2: Thêm Sentry error tracking

**NestJS Backend**:
```typescript
// backend/src/main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,  // 10% traces
});
```

**Python music-ai-service**:
```python
# music-ai-service/app/main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment=os.getenv("ENV", "development"),
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,
)
```

**Frontend (Next.js)**:
```bash
npx @sentry/wizard@latest -i nextjs
```

---

### P3-3: driveToken client-side transmission

**File**: [backend/src/google-drive/dto/import.dto.ts](file:///home/baudui/Projects/project/music/backend/src/google-drive/dto/import.dto.ts)

Hiện tại `driveToken` (Google OAuth token) được truyền từ client trong request body — đây là design issue.

**Long-term fix**: Lưu token server-side (encrypted, per-user) trong DB sau OAuth exchange, không truyền trong request body.

```typescript
// ImportDto hiện tại có field accessToken
// → Chuyển sang: server tự lấy token từ encrypted store

// backend/src/google-drive/google-drive.service.ts
async getStoredToken(userId: string): Promise<string> {
  const user = await this.userRepo.findById(userId);
  return this.encryptionService.decrypt(user.encryptedDriveToken);
}
```

---

### P3-4: CI/CD — Fix cors-fail-closed.spec.ts

**File**: [backend/cors-fail-closed.spec.ts](file:///home/baudui/Projects/project/music/backend/cors-fail-closed.spec.ts)

Test này cần `dist/main.js` build trước — sẽ fail trong CI nếu build step thiếu.

```yaml
# .github/workflows/ci.yml — thêm build step trước e2e test
- name: Build backend
  run: npm run build
  working-directory: backend
  
- name: Run CORS integration test
  run: npm run test:e2e
  working-directory: backend
```

---

### P3-5: E2E test suite

Hiện tại thiếu hoàn toàn E2E test cho luồng chính.

**Checklist cần viết** (theo thứ tự):
1. `auth → register → login → fetchMe` ✅ cần test
2. `album → create → list → find` ✅ cần test
3. `youtube → POST /songs/youtube → queue job → check status` ✅ cần test
4. `drive → listFiles → importFile` ✅ cần test
5. `admin → deleteTrack → cleanupStorage` (chỉ với ADMIN token) ✅ cần test

---

## 📋 Backlog — Biết rồi, để sau

| Issue | Mô tả | Priority |
|-------|--------|----------|
| Stale Drive cache 5 phút | `GoogleDriveService.listFiles()` cache TTL | Low |
| MAX_FILE_SIZE_BYTES hardcode | Nên đọc từ env | Low |
| README music-ai-service trống | Viết deployment guide | Low |
| First admin bootstrap migration | Đã giải quyết ở P3-1 | Done khi P3-1 xong |
| Monitoring/Alerting | Đã giải quyết ở P3-2 | Done khi P3-2 xong |

---

## 🚀 Thứ tự deploy khuyến nghị

```
Week 1 (Pre-deploy):
  Day 1: P1-1 (chọn kiến trúc) + P1-3 (xóa dummy user)
  Day 2: P1-2 (hardening Python nếu giữ) + P1-4 (XSS audit)
  Day 3: P1-5 (OAuth fix) + P2-6 (useOfflineStorage guard)
  
Week 2 (Post-deploy sprint):
  Day 1-2: P2-1 (admin audit log) + P2-2 (JWT migration) + P3-1 (admin bootstrap)
  Day 3: P2-3 (structured logging) + P2-4 (healthcheck Dockerfile)
  
Week 3 (Observability):
  Day 1-2: P3-2 (Sentry) + P3-4 (CI fix)
  Day 3: P3-5 (E2E tests)
```

---

## ✅ Điểm tốt — Không cần thay đổi

| Module | Điểm tốt |
|--------|----------|
| [env.validation.ts](file:///home/baudui/Projects/project/music/backend/src/common/env.validation.ts) | JWT_SECRET required ngoài test — đúng pattern |
| [RolesGuard](file:///home/baudui/Projects/project/music/backend/src/auth/guards/roles.guard.ts) | Fail-closed (return false khi thiếu role) |
| [SongService.createFromYoutube()](file:///home/baudui/Projects/project/music/backend/src/songs/song.service.ts#L22) | sourceId cache hit — reuse URL thay vì re-download |
| [BaseRepository](file:///home/baudui/Projects/project/music/backend/src/common/repositories/base.repository.ts) | Xử lý Prisma P2002/P2025/P2003 chuẩn |
| docker-compose.yml | healthcheck cho redis và postgres |
| [AuthService](file:///home/baudui/Projects/project/music/backend/src/auth/auth.service.ts) | AES-256-GCM token encryption, bcrypt 12 rounds |
| Logging | Pino structured logging, redact sensitive fields |
| CORS | Fail-closed với test riêng (cors-fail-closed.spec.ts) |

---

> **Next action**: Thực thi P1-1 — quyết định giữ NestJS hay Python pipeline,
> sau đó chạy `rtk grep "localhost:8001" /home/baudui/Projects/project/music/frontend` 
> để tìm tất cả điểm gọi hardcode port 8001.
