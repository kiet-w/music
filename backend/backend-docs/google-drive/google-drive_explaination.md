---

# Google Drive Module — AI Coding Skill Context

> File này dùng làm context cho AI coding agent khi làm việc với Google Drive Module.

---

## 1. Kiến trúc tổng thể — Tại sao tổ chức như vậy?

```
HTTP Request
    │
    ▼
GoogleDriveController   ← Nhận Request (OAuth code, fileId import, vv.), gọi GoogleDriveService.
MusicController         ← Alias endpoint cho import (post /music/import).
    │
    ▼
JwtAuthGuard            ← Xác thực token JWT.
    │
    ▼
GoogleDriveService      ← Chứa toàn bộ logic giao tiếp với Google API (OAuth, Drive, Files) và xử lý luồng import file.
    │
    ├──► StorageService   ← Tải file lên storage cloud/local.
    ├──► SongRepository   ← Tạo record cho file nhạc mới.
    ├──► AlbumService     ← Lấy/Tạo album mặc định cho bài hát.
    │
    ▼
[Database PostgreSQL]   ← Thông qua Prisma. Lưu trữ token (User) và metadata (Song, Album).
```

**Tại sao tách các layer?**
- **Tách riêng Storage và Database**: Logic xử lý file vật lý nằm hoàn toàn bên `StorageService`. `GoogleDriveService` chỉ lấy file stream từ Google và ném qua `StorageService`. Điều này giúp GoogleDrive module không cần bận tâm hệ thống lưu trữ dưới nền là S3, local hay r2.
- **Album/Song Dependency**: Inject qua Service/Repository giúp tách biệt logic xử lý âm nhạc ra khỏi module thao tác cloud bên thứ 3.

---

## 2. Các Dependencies

| Dependency | Vai trò |
|------------|---------|
| `PrismaService` | Tương tác trực tiếp với Database để đọc/ghi refresh token và access token trên entity User. |
| `CACHE_MANAGER` | Lưu `state` token OAuth tạm thời (chống CSRF) và kết quả cache khi check status. |
| `StorageService` | Nhận data stream tải từ Drive để lưu trữ làm mp3 hệ thống. |
| `SongRepository` | Tạo mới bản ghi `Song` sau khi import thành công mp3. |
| `AlbumService` & `AlbumRepository` | Xử lý việc chọn Album khi lưu file nhạc mới. |
| `PinoLogger` | Ghi log hệ thống cho Controller. |

---

## 3. Entry Points — Đi đâu về đâu

### GET /google-drive/status

```
Client gửi: {}
    │
    ▼ Controller.getStatus()
    │   → Check cache lấy trạng thái theo userId.
    │
    ▼ Service.isConnected(userId) (nếu cache miss)
    │   1. Lấy thông tin User qua Prisma
    │   2. Trả về true nếu có googleRefreshToken
    │
    ▼ Trả về: { connected: boolean }

Lỗi có thể xảy ra:
- 401 Unauthorized → Lỗi do JwtAuthGuard.
```

### POST /google-drive/exchange-code

```
Client gửi: { code, state }
    │
    ▼ Controller.exchangeCode(dto)
    │   → Pass DTO sang Service.
    │
    ▼ Service.exchangeCodeForTokens(userId, code, state)
    │   1. Validate state parameter từ Redis/Cache để phòng chống CSRF. Nếu sai ném 401.
    │   2. Gọi Google Auth library đổi code lấy Tokens.
    │   3. Lưu accessToken và refreshToken vào DB User.
    │
    ▼ Trả về: { success: true }

Lỗi có thể xảy ra:
- 401 UnauthorizedException → State parameter không đúng hoặc token Google từ chối.
```

### POST /google-drive/import

```
Client gửi: { fileId, albumId?, fileName?, driveToken? }
    │
    ▼ Controller.importFile(dto)
    │
    ▼ Service.importFile()
    │   1. Resolve Album (Tìm qua Repo, nếu k có thì lấy default).
    │   2. Get Metadata từ fileId (Google Drive API).
    │   3. ValidateMp3 (Kiểm tra xem đúng đuôi/mimeType MP3 không).
    │   4. DownloadFile (Tải stream từ Google).
    │   5. Upload sang StorageService.
    │   6. Lưu Song vào Database.
    │
    ▼ Trả về: { id, title, url, ... } (Song object)

Lỗi có thể xảy ra:
- 404 NotFoundException → AlbumId truyền lên không tìm thấy hoặc không thuộc user.
- 400 BadRequestException → File không đúng chuẩn MP3.
- Lỗi kết nối Google API nếu token hỏng.
```

---

## 4. Đánh giá — Đã tốt chưa?

### ✅ Đã làm tốt

| Điểm tốt | Lý do |
|----------|-------|
| Sử dụng Cache cho OAuth State | Tránh CSRF một cách an toàn mà không phải lưu State vào Database, có thêm TTL 5 phút chuẩn mực. |
| Bắt event refresh token tự động | Việc hook vào `oauth2Client.on('tokens')` để lưu DB mỗi khi SDK tự refresh token là rất chắc tay, đảm bảo token luôn mới. |
| Xử lý file Shortcut | Quét và resolve tốt cả file Shortcut trong Google Drive, không giới hạn chỉ file gốc, cải thiện lớn UX. |

### ❌ Chưa tốt / Cần cải thiện

**1. Hardcode Error messages & MimeTypes chưa đưa ra hằng số**
```typescript
// HIỆN TẠI — vấn đề:
const isMp3Mime = metadata.mimeType === 'audio/mpeg' || metadata.mimeType === 'audio/mp3';

// NÊN SỬA — lý do:
// Nên tạo một file constants lưu các Supported Mime Types, và error messages chuẩn hóa cho đa ngôn ngữ (i18n).
```

**2. Chưa quản lý Transaction cho quá trình Import**
```typescript
// HIỆN TẠI:
// Quá trình upload Storage và create DB (songRepository) độc lập. Nếu create DB xịt, file trên Storage thành rác (orphan file).
const path = await this.storageService.uploadStream(...);
return this.songRepository.create(...);

// NÊN SỬA:
// Cần có cơ chế rollback Storage nếu DB create failed, hoặc dùng queue xử lý background job để import file lớn.
```

---

## 5. API Design Review

### Endpoint Naming
```
GET  /google-drive/ping            [✅] Diagnostic tool tốt
GET  /google-drive/status          [✅] Trạng thái logic
GET  /google-drive/auth-url        [✅]
POST /google-drive/exchange-code   [✅]
GET  /google-drive/files           [✅] Danh sách list files
POST /google-drive/import          [✅]
POST /music/import                 [⚠️] Dư thừa. Một module Music riêng chỉ có 1 alias endpoint gọi lại google drive service. Cân nhắc merge.
```

### Response Shape
```typescript
// Các endpoint thường trả về object json nhỏ:
{
  url: string,       // OAuth URL
  success: boolean,  // Thành công hay không
  connected: boolean // Status drive
}
```

### HTTP Status Codes
```
GET  /google-drive/status        → 200 OK  [✅]
POST /google-drive/exchange-code → 201 Created [⚠️] Nên dùng 200 OK (vì không tạo resource HTTP cụ thể)
POST /google-drive/import        → 201 Created [✅] (Tạo ra bài hát)
```

---

## 6. Cách Debug khi gặp lỗi

### Lỗi 401 khi đổi Code (exchange-code)

```
Checklist:
1. Đảm bảo Frontend gửi đúng `state` mà server đã sinh ra trong API `/auth-url`.
2. Kiểm tra log redis/cache xem key có bị expire trước khi đổi không (quá 5 phút).
3. Đảm bảo Google Client Secret và ID trong `.env` server chuẩn.

Command debug:
→ In log `state` lúc tạo và lúc nhận.
```

### Lỗi "Google Drive not connected"

```
Checklist:
1. User đã bị mất `googleRefreshToken` trong database?
2. Có thể user gỡ bỏ cấp quyền (revoke access) từ trang quản lý app Google.

Command debug:
→ Check DB user xem googleRefreshToken có rỗng không:
   `SELECT "googleRefreshToken" FROM users WHERE id = ...;`
```

---

## 7. Các Pattern quan trọng trong module này

### Pattern 1: OAuth2 State Caching
```typescript
// Tại sao dùng pattern này?
// → Tránh CSRF Attack trong quá trình callback OAuth. Bằng cách lưu State trong MemoryCache.

const state = randomUUID();
await this.cacheManager.set(`google_auth_state:${state}`, userId, 300000);

// Khi callback về: kiểm tra state từ client
const cachedUserId = await this.cacheManager.get(`google_auth_state:${state}`);
// Nếu KHÔNG dùng pattern này thì sao?
// → Attacker có thể lừa nạn nhân đổi code của attacker, làm nạn nhân liên kết với Drive của kẻ xấu.
```

### Pattern 2: Stream Piping
```typescript
// Tại sao dùng stream thay vì buffer download hết bộ nhớ?
// → File MP3 có thể lớn (vài chục MB). Download toàn bộ vào RAM sẽ làm ngốn RAM server khi có nhiều request cùng lúc.

const res = await drive.files.get({ fileId, alt: 'media'}, { responseType: 'stream' });
await this.storageService.uploadStream(res.data, ...);

// Truyền thẳng stream từ Google Node SDK sang Storage Service.
```

---

## 8. Biến môi trường cần thiết

```env
GOOGLE_CLIENT_ID=           # ID từ Google Cloud Console
GOOGLE_CLIENT_SECRET=       # Secret key từ Google Cloud Console
GOOGLE_REDIRECT_URI=        # URL frontend callback sau khi user accept quyền
```

---

## 9. Khi AI agent làm việc với module này

**Trước khi thêm feature mới:**
- Bất kì API nào giao tiếp với Drive API đều phải dùng Google OAuth2 Client, và phải gọi `setCredentials(userId)` trước đó.
- Việc xử lý tệp tin tải về (download/upload) luôn phải ưu tiên sử dụng `stream`. Tuyệt đối không đọc toàn bộ buffer để tránh tràn RAM.

**Khi sửa phần nhạy cảm của module:**
- Không sửa logic lắng nghe kiện `this.oauth2Client.on('tokens', ...)` vì nó tự động bắt refresh token từ Google. Nếu hỏng, app sẽ dừng hoạt động sau vài ngày.

**Khi thêm endpoint mới:**
- Luôn inject `@CurrentUser() user` để xác thực context request.
- Các endpoint liên quan đến lấy dữ liệu Drive cần phải catch try/catch hoặc error filter từ Google (đôi khi lỗi 403, 429).

**Khi debug:**
- Các lỗi stream thường không ném qua catch thông thường, hãy log các event stream "error".
- Nếu API trả lỗi auth của Google thì kiểm tra lại accessToken.
