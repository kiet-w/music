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
