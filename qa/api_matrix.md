# 🗺️ BẢN ĐỒ KẾT NỐI VÀ CHI TIẾT CÁC METHOD API (API MATRIX & DETAILED METHODS) - GIAI ĐOẠN 1

Tài liệu này chi tiết hóa **100% các Method/Endpoints** trong cả 2 dịch vụ (`backend` NestJS & `python-backend` FastAPI Converter). Với mỗi Method, tài liệu chỉ rõ: **Mục đích chức năng, Luồng xử lý nghiệp vụ (Business Logic), Dữ liệu đầu vào (Input Payload/Params), và Kết quả mong đợi (Output/Status Codes)**.

---

## 1. NESTJS CORE API (`backend` - Port 3001)

### 🔐 A. Authentication Module (`/auth`)

#### 1. `POST /auth/register`
- **Chức năng:** Đăng ký tài khoản mới.
- **Luồng xử lý:** 
  1. Kiểm tra email đã tồn tại chưa -> Nếu trùng trả lỗi `409 Conflict`.
  2. Mã hóa mật khẩu bằng `bcrypt`.
  3. Tạo mã xác thực OTP (hạn dùng 5 phút) và lưu vào Database.
  4. Gửi email chứa mã OTP đến người dùng.
- **Đầu vào (Body JSON):**
  ```json
  {
    "email": "user@example.com",     // (Bắt buộc, format email)
    "password": "password123",        // (Bắt buộc, tối thiểu 8 ký tự)
    "name": "Nguyen Van A"           // (Tùy chọn)
  }
  ```
- **Đầu ra mong đợi:** `201 Created` + Thông báo kiểm tra Email lấy OTP.

#### 2. `POST /auth/verify-otp`
- **Chức năng:** Xác thực OTP đăng ký tài khoản.
- **Luồng xử lý:** 
  1. Verify OTP và kiểm tra hết hạn.
  2. Kích hoạt tài khoản (`isVerified = true`).
  3. Tạo `accessToken` (JWT) & set `refreshToken` vào HTTP-Only Cookie (`path=/auth`).
- **Đầu vào (Body JSON):** `{"email": "user@example.com", "otp": "123456"}`
- **Đầu ra mong đợi:** `200 OK` + `accessToken` & Cookie `refreshToken`.

#### 3. `POST /auth/login`
- **Chức năng:** Đăng nhập hệ thống.
- **Luồng xử lý:** Check email/password -> Tạo session -> Trả AccessToken & Set Refresh Cookie.
- **Đầu vào (Body JSON):** `{"email": "user@example.com", "password": "password123"}`
- **Đầu ra mong đợi:** `200 OK` (`accessToken`, `user info`) hoặc `401 Unauthorized`.

#### 4. `POST /auth/refresh`
- **Chức năng:** Cap lại Access Token khi hết hạn mà không cần đăng nhập lại.
- **Đầu vào:** Cookie `refreshToken`.
- **Đầu ra mong đợi:** `200 OK` (Token mới) hoặc `401 Unauthorized` (Token hết hạn/không hợp lệ).

#### 5. `POST /auth/logout`
- **Chức năng:** Đăng xuất người dùng, thu hồi Refresh Token trong DB và clear Cookie.

#### 6. `GET /auth/me`
- **Chức năng:** Lấy profile cá nhân người dùng đang đăng nhập.
- **Yêu cầu:** Header `Authorization: Bearer <accessToken>`.

#### 7. `GET /auth/users`
- **Chức năng:** Lấy danh sách tất cả người dùng (Phân trang `page`, `limit`).
- **Yêu cầu:** Phải đăng nhập với Role `ADMIN` hoặc `USER`.

---

### 🎵 B. Songs Module (`/songs`)

#### 1. `GET /songs/youtube/info?url=...`
- **Chức năng:** Lấy trước thông tin bài hát (Tiêu đề, Ca sĩ, Duration) từ liên kết YouTube trước khi bấm tải.
- **Đầu vào:** Query `url` (Link YouTube hợp lệ).
- **Đầu ra:** `200 OK` với thông tin Metadata hoặc `400 Bad Request` (Link hỏng/không hợp lệ).

#### 2. `POST /songs/youtube`
- **Chức năng:** Tạo bài hát mới từ YouTube link và trigger tải bất đồng bộ.
- **Đầu vào (Body JSON):**
  ```json
  {
    "url": "https://www.youtube.com/watch?v=XXXXX",
    "title": "Tên bài hát",
    "artist": "Tên ca sĩ",
    "albumId": "optional-album-id"
  }
  ```
- **Đầu ra:** `201 Created` chứa record bài hát vừa tạo.

#### 3. `GET /songs`
- **Chức năng:** Lấy danh sách bài hát cá nhân của User (Hỗ trợ query `page`, `limit`, `search`).

#### 4. `GET /songs/:id`
- **Chức năng:** Xem chi tiết 1 bài hát theo ID. Trả về `404 Not Found` nếu không thuộc về User.

#### 5. `DELETE /songs/:id`
- **Chức năng:** Xóa bài hát khỏi thư viện cá nhân và xóa file audio gốc trên storage.
- **Đầu ra:** `204 No Content`.

#### 6. `PATCH /songs/:id/move`
- **Chức năng:** Chuyển bài hát sang Album khác.
- **Đầu vào:** `{"albumId": "target-album-id"}`.

---

### 💿 C. Albums Module (`/albums`)

#### 1. `POST /albums`
- **Chức năng:** Tạo Album nhạc mới.
- **Đầu vào:** `{"title": "Album nhạc trẻ", "coverUrl": "https://..."}`
- **Đầu ra:** `201 Created`.

#### 2. `GET /albums` & `GET /albums/:id`
- **Chức năng:** Lấy danh sách album hoặc thông tin chi tiết album cùng danh sách các bài hát bên trong.

#### 3. `DELETE /albums/:id`
- **Chức năng:** Xóa album. (Lưu ý: Album mặc định "Chưa phân loại" sẽ trả lỗi `400 Bad Request` không cho phép xóa).

---

### 💬 D. Messages & Social Module (`/messages`)

#### 1. `POST /messages`
- **Chức năng:** Gửi tin nhắn đến người dùng khác (Hỗ trợ văn bản, link nhạc).
- **Đầu vào:** `{"receiverId": "...", "content": "Chào bạn"}`.

#### 2. `GET /messages/:userId`
- **Chức năng:** Lấy lịch sử đoạn chat 2 người (hỗ trợ phân trang bằng `before` timestamp).

#### 3. `POST /messages/invite` & `GET /messages/invite/info/:token` & `POST /messages/invite/accept/:token`
- **Chức năng:** Tạo link mời kết bạn -> Người nhận xem thông tin link -> Bấm chấp nhận kết bạn.

---

### ☁️ E. Google Drive Module (`/google-drive`)

#### 1. `GET /google-drive/auth-url`
- **Chức năng:** Tạo URL Google OAuth2 để xin cấp quyền đọc Google Drive.

#### 2. `GET /google-drive/files`
- **Chức năng:** Duyệt danh sách tất cả các file nhạc `.mp3`, `.m4a`, `.flac` trên Google Drive người dùng.

#### 3. `POST /google-drive/import`
- **Chức năng:** Nhập bài hát trực tiếp từ Google Drive vào thư viện ứng dụng.

---

### 👑 F. Admin Module (`/admin`)

#### 1. `DELETE /admin/tracks/:id`
- **Chức năng:** Tài khoản Admin xóa bất kỳ bài hát vi phạm nào trong toàn hệ thống.
- **Phân quyền:** Chỉ chấp nhận `UserRole.ADMIN`. Trả về `403 Forbidden` nếu User thường cố tình gọi API.

#### 2. `POST /admin/storage/cleanup`
- **Chức năng:** Admin dọn dẹp dung lượng rác và các file tạm không sử dụng.

---

## 2. PYTHON FASTAPI CONVERTER (`python-backend` - Port 8000)

#### 1. `GET /health` & `GET /health/ready`
- **Chức năng:** Kiểm tra dịch vụ Python Converter có đang live và Redis Queue có kết nối tốt không.

#### 2. `GET /info?url=...`
- **Chức năng:** Dùng thư viện `yt-dlp` lấy metadata từ YouTube (Tiêu đề, thời lượng, thumbnail).

#### 3. `POST /convert`
- **Chức năng:** Đẩy job tải & convert audio vào **Redis/Celery Queue** dưới dạng Async Task.
- **Đầu vào:** `{"url": "https://youtube...", "format": "mp3"}`.
- **Đầu ra:** Trả về `{"task_id": "abc-123", "status": "queued"}` ngay lập tức để không treo kết nối (Non-blocking).

#### 4. `GET /status/{task_id}`
- **Chức năng:** Client/NestJS Polling kiểm tra trạng thái Task (`queued` -> `processing` -> `completed` / `failed`).

#### 5. `GET /download/{filename}`
- **Chức năng:** Stream hoặc Tải file nhạc `.mp3` đã convert hoàn tất về máy client.

---

## 💡 BẢNG TỔNG HỢP METHOD CHỨC NĂNG (SUMMARY METHOD MATRIX)

| Module | Method & Route | Mục Đích Chính | Input Chính | Output / Status Code |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST /auth/register` | Đăng ký & gửi OTP | email, password, name | 201 Created |
| **Auth** | `POST /auth/verify-otp` | Verify OTP | email, otp | 200 OK + JWT Cookie |
| **Auth** | `POST /auth/login` | Đăng nhập | email, password | 200 OK + JWT Cookie |
| **Auth** | `GET /auth/me` | Lấy profile cá nhân | Bearer Token | 200 OK |
| **Songs** | `GET /songs/youtube/info` | Lấy info video YouTube | query `url` | 200 OK |
| **Songs** | `POST /songs/youtube` | Tạo bài hát từ YouTube | url, title, artist | 201 Created |
| **Songs** | `DELETE /songs/:id` | Xóa bài hát | Param `id` | 204 No Content |
| **Albums** | `POST /albums` | Tạo album mới | title, coverUrl | 201 Created |
| **Albums** | `DELETE /albums/:id` | Xóa album | Param `id` | 200 OK / 400 Bad Request |
| **Messages**| `POST /messages` | Gửi tin nhắn | receiverId, content | 201 Created |
| **Drive** | `GET /google-drive/files` | Xem file trên GDrive | Bearer Token | 200 OK |
| **Admin** | `DELETE /admin/tracks/:id` | Admin xóa bài hát | Param `id` + Admin Token | 200 OK / 403 Forbidden |
| **Python** | `POST /convert` | Bắt đầu tải nhạc Async | url, format | 200 OK (`task_id`) |
| **Python** | `GET /status/{task_id}` | Polling trạng thái | `task_id` | 200 OK (`status`) |
