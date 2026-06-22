# Hướng Dẫn Đọc Codebase — Theo Luồng Request, Không Theo Folder

> **Nguyên tắc cốt lõi**: Đừng đọc từ trên xuống theo cấu trúc thư mục — đọc theo **đường đi của một request thực tế**. Đây là cách kỹ sư kinh nghiệm đọc code người khác viết.

---

## Tại Sao Không Đọc Theo Folder?

Folder structure phản ánh cách *tổ chức code*, không phải cách *code chạy*. Nếu đọc theo folder, bạn sẽ:
- Đọc `album.service.ts` mà không biết ai gọi nó, khi nào, với context gì
- Hiểu từng mảnh rời rạc nhưng không build được mental model của toàn hệ thống
- Khó trả lời câu hỏi interview: "Hãy trace một request từ đầu đến cuối"

Đọc theo **request flow** cho bạn hiểu:
1. Request vào từ đâu
2. Qua bao nhiêu lớp
3. Mỗi lớp làm gì và tại sao
4. Response trả về như thế nào

---

## Thứ Tự Đọc — 5 Bước Theo Độ Phức Tạp Tăng Dần

### Bước 1 — Bootstrap & Configuration (app khởi động ra sao?)

**Mục tiêu**: Hiểu app được "sinh ra" như thế nào trước khi nhận bất kỳ request nào.

| File | Đọc để hiểu gì |
|------|----------------|
| `main.ts` | CORS config, Sentry init order, global pipes/filters, Swagger toggle |
| `app.module.ts` | Thứ tự import module (quan trọng — NestJS init tuần tự) |
| `config/env.validation.ts` | Joi validate env, tại sao test có default riêng |

**Câu hỏi tự đặt khi đọc `main.ts`**:
- Nếu `CORS_ORIGINS` không có trong env, app làm gì? (crash hay chạy với `'*'`?)
- Sentry được init ở dòng nào? Nếu exception xảy ra ở dòng ngay sau đó, có được capture không?
- Swagger có chạy ở production không? Tại sao?

```
main.ts flow:
  Sentry.init()          ← TRƯỚC NestFactory — capture bootstrap errors
       ↓
  NestFactory.create()
       ↓
  CORS validate          ← crash nếu thiếu, không silently fail
       ↓
  Global pipes (ValidationPipe)
       ↓
  Global filters (AllExceptionsFilter)
       ↓
  Swagger (chỉ non-prod)
       ↓
  app.listen()
```

---

### Bước 2 — Auth Flow (xương sống của mọi request)

**Mục tiêu**: Hiểu cách identity của user được thiết lập cho từng request.

| File | Đọc để hiểu gì |
|------|----------------|
| `auth/auth.controller.ts` | Endpoint nào public, endpoint nào protected |
| `auth/auth.service.ts` | `register`, `login`, `googleUnifiedLogin` (phức tạp nhất) |
| `auth/jwt-auth.guard.ts` | Token verify + set `request.user` |
| `auth/guards/roles.guard.ts` | RBAC check sau khi đã có user identity |
| `decorators/roles.decorator.ts` | `@Roles()` decorator dùng `SetMetadata` |

**Request flow khi gọi endpoint protected**:
```
Client request
    ↓
JwtAuthGuard.canActivate()
    ↓
  jwtService.verifyAsync(token)    ← verify signature locally, không cần DB
    ↓
  request.user = { id, email, role: payload.role ?? 'USER' }
    ↓
RolesGuard.canActivate() (nếu có @Roles decorator)
    ↓
  reflector.getAllAndOverride('roles', [...handlers])
    ↓
  check request.user.role ∈ requiredRoles
    ↓
Controller method
```

**Điểm quan trọng nhất ở đây**: `payload.role ?? UserRole.USER` — xem phần interview patterns để hiểu tại sao.

---

### Bước 3 — YouTube Download Flow (feature phức tạp nhất, đáng học nhất)

**Mục tiêu**: Hiểu cách tách request HTTP (nhanh) ra khỏi processing nặng (chậm).

| File | Đọc theo thứ tự này |
|------|---------------------|
| `songs/song.controller.ts` | POST `/songs/youtube` — nhận request |
| `songs/song.service.ts` → `createFromYoutube` | Business logic: validate → cache check → create record → enqueue |
| `jobs/conversion.processor.ts` | Worker: download → upload → update DB → cleanup |
| `downloader/services/downloader.service.ts` | Thực thi yt-dlp binary |
| `jobs/cleanup.service.ts` | Cron dọn stuck jobs và file tạm |

**Flow đầy đủ**:
```
POST /songs/youtube
    ↓
[HTTP layer — chỉ làm việc rẻ]
  Validate DTO (IsYouTubeUrlConstraint)
  Check album ownership
  Check sourceId cache (đã download chưa?)
    → HIT: return existing track URL ngay (vài ms)
    → MISS: tiếp tục
  INSERT track record (status: PENDING)
  BullMQ.add(job)         ← đẩy job vào queue
  return { trackId, status: 'PENDING' }   ← HTTP trả ngay, không block
    ↓
[Queue Worker — chạy async, độc lập với HTTP]
  DownloaderService.download(url)
    → Validate YouTube host lại (defense in depth)
    → spawn yt-dlp process
    → transcode 128kbps MP3
  StorageService.uploadStream(readStream)   ← stream, không buffer
  TrackRepository.update(id, { url, status: DONE })
  Cleanup temp file   ← luôn chạy dù success hay fail
```

**Tại sao pattern này quan trọng**: HTTP timeout thường là 30-60s. Download YouTube có thể mất 10-60s+. Nếu xử lý sync, user thấy timeout hoặc phải giữ connection mở. Queue cho phép return ngay trong <100ms và process background.

---

### Bước 4 — Google Drive Import (security-sensitive nhất)

**Mục tiêu**: Xem cách xử lý OAuth token, credential rotation, và import external file.

| File | Điểm cần chú ý |
|------|----------------|
| `google-drive/google-drive.service.ts` | `setCredentials`, `migrateTokens`, `importFile` |

**Pattern đáng học trong file này**:

1. **Token migration lazy**: `onModuleInit` → scan tokens → nếu chưa mã hóa (check `!token.includes(':')`) → mã hóa và lưu lại. Không cần script migration riêng, không cần downtime.

2. **Credential setCredentials flow**:
   ```
   Mỗi khi gọi Google API:
     → decrypt token từ DB
     → oauth2Client.setCredentials(tokens)
     → nếu token hết hạn → auto refresh
     → nếu refresh thành công → re-encrypt new token → save
   ```

3. **importFile flow**:
   - Validate file type (chỉ audio)
   - Download stream từ Google Drive
   - Feed stream trực tiếp vào uploadStream (không buffer vào RAM)
   - Cleanup kể cả khi import fail

---

### Bước 5 — Cross-Cutting Concerns (áp dụng cho mọi request)

**Mục tiêu**: Hiểu những gì wrap xung quanh mọi request, không phải logic của từng feature.

| File | Vai trò |
|------|---------|
| `common/interceptors/logging.interceptor.ts` | Log request/response + redact sensitive fields |
| `common/filters/all-exceptions.filter.ts` | Catch mọi exception, map sang HTTP response đúng |
| `common/services/encryption.service.ts` | AES-256-GCM utility dùng khắp nơi |
| `common/repositories/base.repository.ts` | Map Prisma errors → HTTP exceptions |

**Request lifecycle đầy đủ khi biết cross-cutting concerns**:
```
HTTP Request
    ↓
[LoggingInterceptor] ← ghi nhận request bắt đầu
    ↓
[JwtAuthGuard] ← verify token
    ↓
[RolesGuard] ← check permission
    ↓
[Controller] ← parse DTO, gọi service
    ↓
[Service] ← business logic
    ↓
[Repository] ← DB query
    ↓ (error path)
[BaseRepository.handlePrismaError] ← map P2002→409, P2025→404
    ↓ (error path tiếp)
[AllExceptionsFilter] ← catch tất cả, format error response
    ↓
[LoggingInterceptor] ← ghi nhận response + duration
    ↓
HTTP Response
```

---

## Mental Model Cuối Cùng

Sau khi đọc xong 5 bước, bạn nên tự vẽ được diagram này từ đầu:

```
Request vào
    ↓
Guard (auth + roles)
    ↓
Controller (parse DTO)
    ↓
Service (business logic)
    │
    ├── Repository (data layer → Prisma → DB)
    │
    ├── External Services (Supabase / Google / yt-dlp)
    │       (nếu tác vụ nặng → đẩy vào Queue)
    │
    └── Response (DTO serialization → chỉ expose @Expose fields)
    ↓
Logging (interceptor ghi response time)
Errors (filter catch và format)
```

Khi nào bạn vẽ được diagram này mà không cần nhìn vào code — bạn đã "đọc xong" codebase.

---

## Tips Đọc Code Hiệu Quả

1. **Đọc test trước** — `*.spec.ts` cho biết expected behavior mà không cần trace code
2. **Tìm `@Injectable` và `@Controller`** — đây là entry points của từng module
3. **Nhìn vào `constructor`** — biết ngay service phụ thuộc vào gì
4. **Tìm `try/catch`** — hiểu author anticipate failure ở đâu
5. **Tìm `// TODO` và `// FIXME`** — biết tác giả biết điểm yếu ở đâu nhưng chưa fix
