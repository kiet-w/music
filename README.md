# 🎵 Music App - Hệ thống Quản lý và Phát nhạc cá nhân

Music App là một ứng dụng phát nhạc cá nhân hiện đại, hỗ trợ người dùng quản lý thư viện nhạc, tải nhạc từ YouTube và đồng bộ/nhập nhạc trực tiếp từ Google Drive cá nhân. Hệ thống được thiết kế với kiến trúc chia tách rõ ràng giữa Frontend và Backend.

---

## 🛠️ Công nghệ sử dụng (Technology Stack)

### 1. Frontend (Giao diện người dùng)
* **Framework**: Next.js (React)
* **Styling**: Tailwind CSS / Vanilla CSS
* **Mobile Delivery**: Capacitor (Hỗ trợ đóng gói ứng dụng cho Android và iOS)

### 2. Backend (API & Xử lý dữ liệu)
* **Framework**: NestJS (Node.js TypeScript framework)
* **ORM**: Prisma ORM
* **Tải nhạc**: Tích hợp `yt-dlp` để tải nhạc từ YouTube
* **Đồng bộ**: Google Drive API để duyệt và nhập tệp âm thanh (`mp3`)

### 3. Tính năng Nổi bật (Core Features)
* **YouTube to MP3 (`feat/youtube_to_mp3`)**: Hỗ trợ nhập link YouTube, hệ thống tự động tải và chuyển đổi video thành file âm thanh MP3 chất lượng cao lưu vào thư viện cá nhân thông qua công cụ `yt-dlp` kết hợp hệ thống hàng đợi `BullMQ`.
* **Google Drive Import**: Kết nối an toàn với Google Drive cá nhân, cho phép duyệt và nhập các tệp MP3 có sẵn vào Music App. Hệ thống tự động trích xuất metadata (thời lượng, tên bài hát) và tối ưu hiển thị giao diện mượt mà.

---

## 📁 Cấu trúc thư mục dự án

```text
music/
├── frontend/             # Mã nguồn Frontend (Next.js & Capacitor)
│   ├── src/              # Các components, hooks và pages chính
│   ├── android/          # Thư mục build Android của Capacitor
│   └── package.json
├── backend/              # Mã nguồn Backend (NestJS API)
│   ├── src/              # Modules xử lý logic (Auth, Songs, Albums, Storage, Downloader, Google Drive)
│   ├── prisma/           # Schema database và các file migrations
│   └── package.json
├── .gitignore            # File cấu hình GitIgnore tập trung ở root
└── README.md             # Tài liệu hướng dẫn dự án (File này)
```

---

## 🚀 Hướng dẫn cài đặt & Chạy dự án (Local Setup)

### 1. Cấu hình biến môi trường (Environment Variables)

#### 🔹 Backend:
Tạo file `.env` tại thư mục `backend/` với các biến cần thiết:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/music_db"
JWT_SECRET="your_jwt_secret"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"
```

#### 🔹 Frontend:
Tạo file `.env` tại thư mục `frontend/` với cấu hình kết nối API:
```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

---

### 2. Khởi chạy Backend

Di chuyển vào thư mục `backend/`:
```bash
cd backend
```

Cài đặt các thư viện phụ thuộc:
```bash
npm install
```

Khởi tạo Database và chạy Migration (Prisma):
```bash
npx prisma migrate dev
```

Chạy dự án ở chế độ phát triển (Development):
```bash
npm run start:dev
```

---

### 3. Khởi chạy Frontend

Di chuyển vào thư mục `frontend/`:
```bash
cd frontend
```

Cài đặt các thư viện phụ thuộc:
```bash
npm install
```

Chạy dự án ở chế độ phát triển (Next.js):
```bash
npm run dev
```

Ứng dụng Frontend sẽ hoạt động tại địa chỉ: `http://localhost:3001` (hoặc cổng được chỉ định).

---

## ⚠️ Lưu ý quan trọng về Git & Bảo mật (Git Policies)

Dự án đã được cấu hình `.gitignore` rất chặt chẽ tại thư mục gốc nhằm tránh việc push các file thừa hoặc nhạy cảm lên GitHub. 

**Vui lòng tuân thủ các quy tắc sau:**
1. **Không push file nhạy cảm**: Tuyệt đối không commit file cấu hình biến môi trường (`.env`) và file cookie đăng nhập (`backend/cookies.txt`).
2. **Tránh commit các thư mục tự động sinh**:
   - Thư mục build: `.next/`, `dist/`, `out/`, `node_modules/`.
   - Thư mục tài liệu tự động: `backend-docs/`, `frontend-docs/`, `docs/`.
   - Các thư mục ẩn hỗ trợ AI/IDE: `.codegraph/`, `.gemini/`, `.serena/`, `.superpowers/`, `.vscode/`, `.idea/`.
3. **File nhị phân nặng**: `backend/yt-dlp` được sử dụng local để tải nhạc và đã được ignore để không làm nặng Git repository.

---

## 🔒 Bản Cập Nhật Tối Ưu Hóa & Bảo Mật (Production Optimizations & Hardening)

Hệ thống đã được tối ưu hóa toàn diện từ Phase 1 đến Phase 4 phục vụ môi trường Production:

### 1. Backend Hardening
*   **Role-Based Access Control (RBAC)**: Thêm hệ thống vai trò `USER` và `ADMIN`. Bảo vệ các endpoint quản trị (`AdminController` và `/auth/users`) thông qua `JwtAuthGuard` kết hợp `RolesGuard`.
*   **CORS Whitelisting**: Giới hạn CORS chặt chẽ cho các nguồn được khai báo trong biến môi trường `CORS_ORIGINS`.
*   **Rate Limiting**: Triển khai `@nestjs/throttler` giới hạn request trên toàn hệ thống và áp dụng throttle nghiêm ngặt trên các api nhạy cảm như login, register, và Youtube download.
*   **OAuth Token Encryption**: Mã hóa hoàn toàn các token Google Access/Refresh trong DB bằng AES-256-GCM bảo vệ chống rò rỉ dữ liệu.
*   **yt-dlp Supply Chain & Checksum Verification**: Tải bản release pinned `yt-dlp` kèm xác minh mã SHA-256 chặt chẽ trước khi thiết lập quyền chạy.
*   **BullMQ Resilience**: Tối ưu luồng download nhạc với cơ chế retry exponential backoff và giới hạn xử lý tối đa 2 job song song bảo vệ tài nguyên CPU/RAM.
*   **Repository Generics**: Nâng cao độ an toàn kiểu tĩnh (Type safety) cho `BaseRepository` thông qua Prisma type parameters.

### 2. Frontend Hardening & UX Polish
*   **Redact Sensitive Data**: Logging interceptor ở backend chủ động che (`[REDACTED]`) các trường token nhạy cảm trong body.
*   **Google Access Token Revocation**: Client tự động thu hồi và hủy token bằng `window.google.accounts.oauth2.revoke()` ngay sau khi import thành công hoặc thất bại.
*   **Secure Capacitor Native Storage**: Tự động phát hiện Capacitor native platform và sử dụng `@capacitor/preferences` lưu trữ token an toàn (fallback về `localStorage` trên Web).
*   **Global 401 Interception**: Bắt lỗi `401 Unauthorized` tập trung tại API client để tự động xóa session và redirect người dùng về trang login.
*   **Toast Notifications & Custom Modals**: Thay thế toàn bộ popup `alert()`, `confirm()`, `prompt()` mặc định bằng hệ thống Toast (`sonner`) mượt mà và các custom modal kính mờ cao cấp hỗ trợ chọn trực quan Album.
*   **Containerization**: Cung cấp cấu hình Dockerfile đa tầng tối ưu Next.js Standalone phục vụ Kubernetes/VPS.
