# Security — 15 Lớp Bảo Mật

## Tổng Quan: Defense in Depth

Hệ thống áp dụng nguyên tắc "defense in depth" — mỗi lớp bảo vệ hoạt động độc lập. Nếu một lớp bị bypass, lớp tiếp theo vẫn bảo vệ.

---

## 1. CORS Fail-Closed (Startup Security)

**Vị trí**: `src/main.ts`

```typescript
const corsOriginsEnv = process.env.CORS_ORIGINS;
if (!corsOriginsEnv) {
  throw new Error('CORS_ORIGINS environment variable is missing. Application must fail-closed.');
}
```

**Ý nghĩa**: App crash ngay khi khởi động nếu `CORS_ORIGINS` không được set. Không bao giờ chạy với CORS mở wildcard. Fail loud thay vì fail silent.

**So sánh**:
- ❌ Sai: `origin: process.env.CORS_ORIGINS || '*'`
- ✅ Đúng: Throw error nếu biến môi trường không có

---

## 2. JWT Authentication

**Vị trí**: `src/auth/jwt-auth.guard.ts`, `src/auth/auth.service.ts`

```typescript
// JWT payload gồm: { sub: userId, email, role }
// Secret: JWT_SECRET từ env (minimum 32 chars khuyến nghị)
// Expiry: JWT_EXPIRES_IN (default: 7d)
```

**Guards**:
- `@UseGuards(JwtAuthGuard)` — trên mọi endpoint cần auth
- `@CurrentUser()` decorator — extract user từ JWT payload

**Backward compatibility**: JWT cũ không có `role` field → default về `USER` (`payload.role ?? UserRole.USER`) — tránh mass logout khi rollout RBAC.

---

## 3. Role-Based Access Control (RBAC)

**Vị trí**: `src/auth/guards/roles.guard.ts`, `src/auth/decorators/roles.decorator.ts`

```typescript
// Admin-only endpoints
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController { ... }

// AUTH endpoint cũng có admin route
@Get('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async findAll() { ... }
```

**Lưu ý**: `RolesGuard` phải đi SAU `JwtAuthGuard` để có `user` trong request context.

---

## 4. AES-256-GCM Encryption (Google Tokens)

**Vị trí**: `src/auth/auth.service.ts` hoặc `src/common/services/encryption.service.ts`

```typescript
// Encrypt trước khi lưu DB
const encrypted = encryptAES256GCM(plainToken, process.env.ENCRYPTION_KEY);
await prisma.user.update({ data: { googleAccessToken: encrypted } });

// Decrypt khi cần dùng
const plain = decryptAES256GCM(user.googleAccessToken, process.env.ENCRYPTION_KEY);
```

**Chi tiết kỹ thuật**:
- Algorithm: AES-256-GCM (Galois/Counter Mode)
- GCM mode cung cấp cả **confidentiality** (mã hóa) và **integrity** (authTag verify)
- Nếu ENCRYPTION_KEY bị sai hoặc data bị tamper → decryption throw error
- Key: 32-byte hex string từ `ENCRYPTION_KEY` env var

**Lazy Migration Pattern**:
```typescript
// Khi đọc token:
// 1. Thử decrypt (token mới đã encrypt)
// 2. Nếu fail → token cũ chưa encrypt → dùng trực tiếp + re-encrypt ngay
// Không cần migration script, không cần downtime
```

---

## 5. SSRF Protection (Server-Side Request Forgery)

**Vị trí**: `src/common/validators/youtube-url.validator.ts`, `src/downloader/services/downloader.service.ts`

**2 lớp validation độc lập**:

**Lớp 1 — DTO Validator** (Controller level):
```typescript
// Custom validator kiểm tra hostname
@IsYouTubeUrl()
url: string;
// Chỉ cho phép: youtube.com, youtu.be, www.youtube.com
// Chặn: http://169.254.169.254/, http://localhost:6379/, internal IPs
```

**Lớp 2 — Service level** (trước khi spawn yt-dlp):
```typescript
// DownloaderService validate lại trước khi spawn process
// Lý do: Service có thể bị gọi trực tiếp từ script/test mà không qua DTO
private validateYouTubeUrl(url: string): void {
  const parsed = new URL(url);
  const allowed = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'];
  if (!allowed.includes(parsed.hostname)) {
    throw new BadRequestException('Only YouTube URLs are allowed');
  }
}
```

**Tại sao cần 2 lớp**: Defense in depth — nếu DTO bị bypass, service vẫn an toàn.

---

## 6. Rate Limiting (Throttler)

**Vị trí**: `src/app.module.ts`, `src/songs/song.controller.ts`, `src/auth/auth.controller.ts`

```typescript
// Global: 10 req/phút per IP
ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])

// Stricter cho sensitive endpoints
@UseGuards(ThrottlerGuard)
async createFromYoutube() { ... }
```

**Mục đích**:
- Chống brute force login
- Ngăn spam YouTube download (yt-dlp calls tốn tài nguyên)
- Fair use protection

---

## 7. Input Validation (ValidationPipe)

**Vị trí**: `src/main.ts`

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // Strip extra fields không có trong DTO
  forbidNonWhitelisted: true, // 400 nếu có field không khai báo
  transform: true,           // Auto-transform type (string → number)
}));
```

**DTO rules**:
- Mọi field có validator (`@IsString`, `@IsUUID`, etc.)
- `@MaxLength` cho string fields — ngăn large payload
- Custom validators cho business rules (YouTube URL format)
- `@IsOptional()` explicit — không nhận `undefined` mà không có handler

---

## 8. Response Data Whitelist (Output DTO)

**Vị trí**: `src/songs/dto/song-response.dto.ts`, tất cả `*-response.dto.ts`

```typescript
export class SongResponseDto {
  @Expose() id: string;
  @Expose() title: string;
  @Expose() url: string;
  // Không có: userId, passwordHash, googleAccessToken, etc.
}

return plainToInstance(SongResponseDto, song, {
  excludeExtraneousValues: true,  // Chỉ trả field có @Expose
});
```

**Bảo mật**: Schema DB thêm column nhạy cảm mới → response không tự động include nó. Whitelist thay vì blacklist.

---

## 9. Structured Log Redaction

**Vị trí**: `src/app.module.ts` (pino config)

```typescript
redact: {
  paths: ['req.headers.authorization', 'req.headers.cookie'],
  censor: '[REDACTED]',
},
```

**2 lớp redaction**:
1. **pino logger** (tự động): redact header ở log transport level
2. **LoggingInterceptor**: redact trước khi log ở app level

Nếu một lớp bị misconfigure, lớp kia vẫn che được token.

---

## 10. Pagination Cap (Resource Exhaustion Protection)

**Vị trí**: Mọi endpoint có list (songs, albums, users)

```typescript
const take = Math.min(limit ? parseInt(limit, 10) : 50, 100); // Hard cap 100
```

**Không có cap**: Attacker gửi `?limit=9999999` → DB query lấy toàn bộ bảng → slow query → ảnh hưởng mọi user.

---

## 11. Global Exception Filter (Thông Tin Rò Rỉ)

**Vị trí**: `src/common/filters/all-exceptions.filter.ts`

```typescript
// Production: không expose stack trace
// Development: có thể include chi tiết hơn
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"  // Generic message, không phải stack trace
}
```

**Lý do**: Stack trace tiết lộ file paths, library versions, internal structure.

---

## 12. Google OAuth State Validation (CSRF)

**Vị trí**: `src/google-drive/google-drive.service.ts`

```typescript
// Khi tạo auth URL: generate state token, lưu vào session/cache
// Khi exchange code: validate state khớp với lúc tạo
// State mismatch → reject (CSRF attack bị chặn)
```

**Tại sao quan trọng**: Không có state → attacker có thể trick user authorize Drive cho attacker's account.

---

## 13. Cascade Delete (Data Isolation)

**Vị trí**: `backend/prisma/schema.prisma`

```prisma
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

Khi User bị xóa → tất cả Album, Track, Message, FriendRequest, DownloadJob của user đó cũng tự động bị xóa. Không có data orphan.

Cũng đảm bảo: User A không thể access data của User B (service luôn filter `WHERE userId = currentUserId`).

---

## 14. Env Validation Schema (Startup Fail-Fast)

**Vị trí**: `src/config/env.validation.ts`

```typescript
export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  ENCRYPTION_KEY: Joi.string().required(),
  CORS_ORIGINS: Joi.string().required(),
  // ...
});

ConfigModule.forRoot({
  validationSchema: envValidationSchema,
  validationOptions: { abortEarly: true },
})
```

**Kết quả**: App crash với error rõ ràng ngay khi start nếu thiếu biến. Không bao giờ chạy production với missing config.

---

## 15. Sentry Error Tracking (Security Monitoring)

**Vị trí**: `src/main.ts`

```typescript
// Phải init TRƯỚC mọi import khác
import * as Sentry from '@sentry/node';
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: production ? 0.2 : 1.0,
});
```

**Tại sao init sớm**: Sentry cần wrap global error handlers trước khi các module khác setup error handling. Init muộn → có thể miss errors.

**Security monitoring**: 5xx errors được tự động report. Có thể set alert khi error spike bất thường (potential attack).

---

## Security Checklist Pre-Deploy

- [ ] `CORS_ORIGINS` chỉ chứa domain thật, không có wildcard `*`
- [ ] `JWT_SECRET` ≥ 32 chars, random, không phải default value
- [ ] `ENCRYPTION_KEY` là 32-byte hex (64 hex chars)
- [ ] `SENTRY_DSN` được set để catch production errors
- [ ] `NODE_ENV=production` (tắt Swagger, strict log level)
- [ ] Rate limiting đang active (kiểm tra ThrottlerModule)
- [ ] PostgreSQL không exposed trực tiếp ra internet (chỉ internal)
- [ ] Redis không exposed ra internet
- [ ] Supabase RLS (Row Level Security) được enable nếu dùng anon key
- [ ] `GRAFANA_PASSWORD` đã đổi từ default `admin`