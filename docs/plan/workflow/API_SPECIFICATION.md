# API Specification — Music App Backend

Base URL: `https://yourdomain.com/api` (production) | `http://localhost:4000` (dev)

Authentication: `Authorization: Bearer <jwt_token>` (tất cả endpoints ngoại trừ `/auth/register`, `/auth/login`, `/auth/google`, `/auth/google-unified`, `/health`)

Rate Limit: `10 requests/phút per IP` (global). Một số endpoint có giới hạn riêng.

---

## Auth Endpoints

### `POST /auth/register`
Tạo tài khoản mới bằng email/password.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response 201**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": null,
    "role": "USER"
  }
}
```

**Errors**: `400` (validation fail), `409` (email đã tồn tại)

---

### `POST /auth/login`
Đăng nhập bằng email/password.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response 200**: Giống `/auth/register`

**Errors**: `401` (sai credentials)

---

### `POST /auth/google`
Đăng nhập bằng Google ID Token (mobile/web).

**Request Body**:
```json
{
  "idToken": "google_id_token_from_client"
}
```

**Response 200**: Giống `/auth/register`

**Errors**: `401` (invalid Google token)

---

### `POST /auth/google-unified`
Đăng nhập + kết nối Google Drive cùng lúc (SSO unified flow).

**Request Body**:
```json
{
  "code": "google_oauth_authorization_code",
  "redirectUri": "https://yourdomain.com/callback"
}
```

**Response 200**: Giống `/auth/register`

**Errors**: `401` (Google auth failed)

---

### `GET /auth/me`
🔒 Lấy thông tin user hiện tại.

**Response 200**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Nguyen Van A",
  "role": "USER",
  "createdAt": "2024-01-15T02:00:00.000Z"
}
```

---

### `GET /auth/google/status`
🔒 Kiểm tra trạng thái kết nối Google Drive.

**Response 200**:
```json
{
  "connected": true
}
```

---

### `GET /auth/users`
🔒 👑 ADMIN: Danh sách tất cả users.

**Query Params**: `page=1&limit=20`

**Response 200**:
```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

---

## Songs Endpoints

### `POST /songs/youtube`
🔒 ⚡ Rate limited. Tải nhạc từ YouTube URL.

**Request Body**:
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "title": "Never Gonna Give You Up",
  "artist": "Rick Astley",
  "albumId": "optional-uuid"
}
```

**Response 201**:
```json
{
  "id": "uuid",
  "title": "Never Gonna Give You Up",
  "artist": "Rick Astley",
  "url": "",
  "duration": null,
  "albumId": "uuid",
  "sourceType": "youtube",
  "sourceId": "dQw4w9WgXcQ",
  "createdAt": "2024-01-15T02:13:45.123Z"
}
```

> **Note**: `url: ""` khi đang processing. Client poll `GET /songs/:id` để check khi url không rỗng.
> Nếu track reuse xảy ra, `url` trả về ngay Supabase URL (không rỗng).

**Errors**: `400` (URL không phải YouTube), `404` (albumId không tồn tại), `429` (rate limit)

---

### `GET /songs`
🔒 Lấy danh sách tracks của user (có pagination).

**Query Params**: `page=1&limit=20` (max limit: 100)

**Response 200**:
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Song Title",
      "artist": "Artist Name",
      "url": "https://supabase.co/.../songs/uuid.mp3",
      "duration": 213,
      "albumId": "uuid",
      "album": { "id": "uuid", "title": "Default Album" },
      "createdAt": "2024-01-15T02:13:45.123Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

---

### `GET /songs/:id`
🔒 Lấy thông tin một track.

**Response 200**: Single track object

**Errors**: `404` (không tồn tại hoặc không phải của user)

---

### `DELETE /songs/:id`
🔒 Xóa track.

**Response 204**: No content

**Errors**: `404`

---

### `PATCH /songs/:id/move`
🔒 Chuyển track sang album khác.

**Request Body**:
```json
{ "albumId": "target-album-uuid" }
```

**Response 200**: Updated track object

**Errors**: `404` (track hoặc album không tồn tại)

---

## Albums Endpoints

### `POST /albums`
🔒 Tạo album mới.

**Request Body**:
```json
{
  "title": "My Playlist",
  "artist": "Various",
  "coverUrl": "https://..."
}
```

**Response 201**: Album object

---

### `GET /albums`
🔒 Danh sách albums của user.

**Query Params**: `page=1&limit=20` (max: 100)

**Response 200**:
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Default Album",
      "artist": null,
      "coverUrl": null,
      "isDefault": true,
      "userId": "uuid",
      "createdAt": "2024-01-15T..."
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

### `GET /albums/:id`
🔒 Lấy album theo ID.

**Response 200**: Album object

**Errors**: `404`

---

## Google Drive Endpoints

### `GET /google-drive/status`
🔒 Trạng thái kết nối Google Drive (cached 5 phút).

**Response 200**: `{ "connected": false }`

---

### `GET /google-drive/auth-url`
🔒 Lấy URL để user authorize Google Drive.

**Response 200**: `{ "url": "https://accounts.google.com/o/oauth2/auth?..." }`

---

### `POST /google-drive/exchange-code`
🔒 Đổi OAuth code thành tokens.

**Request Body**:
```json
{
  "code": "4/0AX4XfWg...",
  "state": "csrf-state-token"
}
```

**Response 200**: `{ "success": true }`

**Errors**: `401` (invalid code/state)

---

### `GET /google-drive/files`
🔒 Danh sách file nhạc trong Google Drive.

**Response 200**:
```json
[
  {
    "id": "drive-file-id",
    "name": "song.mp3",
    "mimeType": "audio/mpeg",
    "size": "5242880"
  }
]
```

---

### `POST /google-drive/import`
🔒 Import file từ Google Drive vào thư viện.

**Request Body**:
```json
{
  "fileId": "drive-file-id",
  "albumId": "optional-uuid",
  "title": "Optional custom title"
}
```

**Response 201**: Track object

---

## Messages Endpoints

### `POST /messages`
🔒 Gửi message.

**Request Body**:
```json
{
  "receiverId": "user-uuid",
  "content": "Hello!"
}
```

**Response 201**:
```json
{
  "id": "uuid",
  "content": "Hello!",
  "senderId": "uuid",
  "receiverId": "uuid",
  "createdAt": "..."
}
```

---

### `GET /messages/:userId`
🔒 Lịch sử chat với user (2 chiều, sắp xếp theo thời gian).

**Response 200**: `MessageResponseDto[]`

---

## Friend Requests Endpoints

### `POST /friend-requests`
🔒 Tạo lời mời kết bạn (trả về link token).

**Response 201**:
```json
{
  "id": "uuid",
  "token": "unique-invite-token",
  "expiresAt": "2024-01-16T..."
}
```

---

### `POST /friend-requests/accept/:token`
🔒 Chấp nhận lời mời kết bạn.

**Response 200**: `{ "success": true }`

**Errors**: `404` (token không tồn tại), `410` (đã hết hạn)

---

## Admin Endpoints

> 👑 Tất cả admin endpoints yêu cầu role `ADMIN`.

### `DELETE /admin/tracks/:id`
🔒 👑 Xóa bất kỳ track nào (kể cả của user khác).

**Response 200**: `{ "deleted": true }`

---

### `POST /admin/storage/cleanup`
🔒 👑 Dọn dẹp storage orphaned files.

**Request Body**: Theo `CleanupStorageDto`

**Response 200**: Cleanup result

---

## System Endpoints

### `GET /health`
Liveness check (không cần auth).

**Response 200**: `{ "status": "ok", "timestamp": "..." }`

---

### `GET /metrics`
Prometheus metrics endpoint.

**Response 200**: Prometheus text format

---

## Error Response Format (RFC 7807)

Mọi lỗi đều trả về cùng format:

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Song not found",
  "timestamp": "2024-01-15T02:13:45.123Z",
  "path": "/songs/invalid-id"
}
```

---

## Rate Limit Headers

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1705283625
Retry-After: 45   (chỉ khi bị throttle, status 429)
```