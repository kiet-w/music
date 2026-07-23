# 🎵 Music App (Full-stack Ecosystem)

Hệ sinh thái ứng dụng Nghe nhạc & Chuyển đổi nhạc Đa nền tảng (Web & Android APK) được xây dựng theo kiến trúc Microservices hiện đại, hỗ trợ chuyển đổi nhạc YouTube, tích hợp Google Drive, nhắn tin thời gian thực và quản lý Album cá nhân.

---

## 🚀 Công nghệ sử dụng (Tech Stack)

### 🎨 Frontend
- **Framework:** Next.js 15 (App Router) + React 19 (Turbopack compiler)
- **Ngôn ngữ:** TypeScript
- **Styling & UI:** Vanilla CSS + Tailwind CSS + Glassmorphism Aesthetics + Lucide Icons
- **Quản lý State:** Zustand (Player, Auth, Chat, Albums, DownloadHistory)
- **Trình phát Audio:** Howler.js (Audio Engine)
- **Đa ngôn ngữ (i18n):** `next-intl` (Hỗ trợ 100% từ điển `vi.json` & `en.json`)
- **App Di động:** Capacitor 8.x (Android APK Native integration)
- **Hệ thống Loading:** `GlobalLoading` hợp nhất (Popup kính mờ nổi chính giữa màn hình)

### ⚙️ NestJS Main Backend
- **Framework:** NestJS 11
- **Database & ORM:** PostgreSQL + Prisma ORM
- **Hàng đợi & Cache:** Redis + BullMQ (High-performance Job Queue)
- **Realtime Chat:** Socket.io (`MessagesGateway`)
- **Lưu trữ File:** Supabase Storage
- **Xác thực:** JWT + Google OAuth 2.0
- **Bảo mật & CORS:** Tự động hỗ trợ Whitelist Origin cho Capacitor App (`https://localhost`, `capacitor://localhost`)

### 🐍 Python Converter Microservice (`python-backend/`)
- **Framework:** FastAPI + Uvicorn (ASGI Async Web Framework)
- **Download Engine:** Native `yt_dlp` Python Module (Xử lý trực tiếp trên RAM, không tốn tài nguyên subprocess CLI)
- **Background Queue:** FastAPI `BackgroundTasks` (Chuyển đổi bất đồng bộ ngầm mà không cần hạ tầng Redis/Celery rườm rà)
- **Hiệu năng & An toàn:** Dùng đĩa tạm `/tmp` hệ thống (Tránh tràn bộ nhớ `/dev/shm` OOM), phản hồi `taskId` trong **10ms** và bóc tách metadata trong **0.3s - 0.5s**.

---

## 📁 Cấu trúc Thư mục Dự án

```
music/
├── frontend/                 # Web & Mobile App (Next.js 15 + Capacitor 8)
│   ├── src/
│   │   ├── app/             # App Router routes & loading boundaries
│   │   ├── components/      # React Atomic UI components
│   │   │   ├── atoms/       # Components nhỏ (GlobalLoading, Button, v.v.)
│   │   │   ├── molecules/   # Components vừa (PlayerBar, ChatInput, Navbar)
│   │   │   ├── features/    # Components theo tính năng (music, chat, albums)
│   │   │   ├── pages/       # Giao diện chính của từng trang
│   │   │   └── templates/   # Wrappers & Layout templates
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # API helpers & security utilities
│   │   ├── store/           # Zustand state management
│   │   └── messages/        # i18n translations (vi.json & en.json)
│   ├── android/             # Capacitor Android Native Project
│   └── package.json
│
├── backend/                  # NestJS Main Backend Service
│   ├── src/
│   │   ├── auth/            # JWT & Google OAuth 2.0
│   │   ├── songs/           # Quản lý nhạc & kết nối Downloader
│   │   ├── albums/          # Quản lý Album cá nhân
│   │   ├── messages/        # Chat realtime & Lời mời kết bạn
│   │   ├── downloader/      # Service tự động gọi yt-dlp & aria2c
│   │   ├── google-drive/    # Tích hợp lấy nhạc từ Google Drive
│   │   ├── storage/         # Lưu trữ Supabase Cloud
│   │   └── main.ts          # NestJS Entrypoint & Whitelist CORS
│   ├── prisma/              # Prisma Schema & Migrations
│   └── package.json
│
├── python-backend/           # Lean FastAPI YouTube Converter Microservice
│   ├── main.py              # Single-file FastAPI Service (~110 lines)
│   ├── requirements.txt     # Python Dependencies (fastapi, uvicorn, yt-dlp)
│   └── README.md
│
├── .vscode/                  # VS Code Workspace Configuration
│   ├── settings.json        # Native Bracket Pair Colorization settings
│   └── extensions.json      # Recommendations
├── AGENTS.md                 # Quy tắc phát triển an toàn cho AI & Dev
└── README.md                 # Tài liệu hướng dẫn dự án
```

---

## 🗄️ Database Schema & Entities

| Model | Mô tả |
|---|---|
| `User` | Tài khoản người dùng (Email/Password & Google OAuth) |
| `Album` | Album nhạc cá nhân (Mỗi người dùng có album mặc định) |
| `Track` | Bài hát trong thư viện (Hỗ trợ nguồn YouTube & Google Drive) |
| `Message` | Tin nhắn thời gian thực giữa các người dùng |
| `FriendRequest` | Lời mời kết bạn & mã Token kết nối |
| `DownloadJob` | Hàng đợi tải nhạc ngầm BullMQ |

---

## ⚡ Hướng dẫn Chạy ứng dụng (Getting Started)

### 1. Khởi chạy NestJS Backend (Port 4000)

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### 2. Khởi chạy Python Converter Service (Port 8001)

```bash
cd python-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 main.py
```

### 3. Khởi chạy Frontend Next.js Web (Port 3000)

```bash
cd frontend
npm install
npm run dev
```

### 4. Build & Chạy APK Android (Capacitor)

```bash
cd frontend
npm run build:apk
npx cap open android
```
*(Thao tác này tự động build Next.js với backend Production `https://music-backend-cb0i.onrender.com` và đồng bộ với Android Studio)*.

---

## 📡 Chi tiết API Endpoints

### 🐍 Python Microservice (Port 8001)
- `GET /health` - Kiểm tra trạng thái service.
- `GET /info?url=...` - Lấy thông tin bài hát (tên, ca sĩ, thumbnail) trong ~0.3s.
- `POST /convert` - Nhận request convert, trả về `taskId` trong 10ms và chạy ngầm.
- `GET /status/{taskId}` - Kiểm tra tiến độ convert (`processing` / `completed` / `failed`).
- `GET /download/{filename}` - Tải hoặc phát trực tiếp file MP3.

### ⚙️ NestJS Main Backend (Port 4000 / Production)
- `POST /auth/register` - Đăng ký tài khoản
- `POST /auth/login` - Đăng nhập tài khoản
- `POST /auth/google` - Đăng nhập bằng Google
- `GET /songs` - Lấy danh sách nhạc cá nhân
- `POST /songs/youtube` - Tải nhạc YouTube về thư viện
- `GET /albums` - Lấy danh sách Album
- `POST /albums` - Tạo Album mới
- `POST /messages` - Gửi tin nhắn bạn bè
- `POST /friend-requests/invite` - Tạo mã Token kết bạn

---

## 🧪 Kiểm thử & Xác minh Code (Testing)

```bash
# Kiểm tra Type strict trên Frontend
cd frontend
npx tsc --noEmit

# Chạy Unit Tests trên Frontend
npm run test
```

---

## 📝 Bản quyền & Tác giả

- **Tác giả:** **kiet-w** - [GitHub Repository](https://github.com/kiet-w/music)
- **Giấy phép:** Private - Bảo lưu mọi quyền.
