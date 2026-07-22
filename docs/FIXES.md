 # 🛠️ Nhật ký Khắc phục Lỗi – Backend Music App

> **Ngày:** 04/07/2026  
> **Môi trường:** Ubuntu Linux, NestJS + Prisma + Supabase + Redis + BullMQ

---

## 1. Lỗi Prisma: Invalid database URL (`P1013`)

**Triệu chứng:**
```
Error: P1013: The provided database string is invalid.
invalid domain character in database URL.
```

**Nguyên nhân:**  
File `.env` chứa các placeholder mẫu có ký tự `[` và `]` trong URL database, ví dụ:
```
DATABASE_URL="postgresql://postgres.[THAY_BANG_PROJECT_REF]:[THAY_BANG_MAT_KHAU]@aws-0-[THAY_BANG_REGION].pooler.supabase.com:6543/postgres"
```
Prisma không thể phân tích URL chứa dấu ngoặc vuông.

**Cách khắc phục:**  
Thay thế toàn bộ placeholder bằng thông tin thật từ Supabase Dashboard → Project Settings → Database:
```env
DATABASE_URL="postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

---

## 2. Lỗi TypeScript: `UserRole`, `JobStatus`, `FriendRequest` không tồn tại trong `@prisma/client`

**Triệu chứng:**
```
error TS2305: Module '"@prisma/client"' has no exported member 'UserRole'.
error TS2305: Module '"@prisma/client"' has no exported member 'JobStatus'.
error TS2339: Property 'role' does not exist on type '{...}'.
```

**Nguyên nhân:**  
Lệnh `prisma db pull` đã ghi đè file `schema.prisma` bằng cấu trúc database cũ (thiếu các enum `UserRole`, `JobStatus`, `RequestStatus` và các model `FriendRequest`, `DownloadJob`). Kết quả là Prisma Client được generate thiếu các kiểu dữ liệu cần thiết.

**Cách khắc phục:**
1. Khôi phục lại `schema.prisma` đầy đủ (bao gồm tất cả enum và model).
2. Reset database để đồng bộ schema mới:
   ```bash
   npx prisma db push --force-reset
   ```
3. Generate lại Prisma Client:
   ```bash
   npx prisma generate
   ```
4. Khởi động lại NestJS để load lại `node_modules/@prisma/client`.

---

## 3. Lỗi Config: `ENCRYPTION_KEY` không được để trống

**Triệu chứng:**
```
Error: Config validation error: "ENCRYPTION_KEY" is not allowed to be empty
```

**Nguyên nhân:**  
Biến `ENCRYPTION_KEY` trong `.env` bị bỏ trống, trong khi `ConfigModule` của NestJS có validation yêu cầu giá trị bắt buộc.

**Cách khắc phục:**  
Tạo một chuỗi hex ngẫu nhiên 32-byte (64 ký tự) và đặt vào biến môi trường:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Kết quả dán vào `.env`:
```env
ENCRYPTION_KEY=58c6a9d007e8e02b129014ada0141ff8c21bac43e0fa12cc912a9247eac95ce2
```

---

## 4. Lỗi Redis: `ECONNREFUSED 127.0.0.1:6379` (BullMQ worker error)

**Triệu chứng:**
```
AggregateError [ECONNREFUSED]:
  Error: connect ECONNREFUSED 127.0.0.1:6379
[BullMQ worker error]
```

**Nguyên nhân:**  
BullMQ (hệ thống queue) yêu cầu một server Redis đang chạy ở port 6379, nhưng Redis chưa được khởi động.

**Cách khắc phục:**  
Redis đã được cài sẵn trên máy, chỉ cần kích hoạt và bật auto-start:
```bash
sudo systemctl enable --now redis-server
```
Vì Redis cài mặc định không có mật khẩu, đồng thời xóa `REDIS_PASSWORD` trong `.env`:
```env
REDIS_PASSWORD=
```

---

## 5. Lỗi Download YouTube: `[Downloader] Unexpected error`

**Triệu chứng:**
```
ERROR: [DownloaderService] [Downloader] Unexpected error
💥 ERROR trong SECTION [YouTube Conversion] - Job Processing
```

**Nguyên nhân (2 vấn đề song song):**

### 5a. ffmpeg binary chưa được tải về
Package `ffmpeg-static` được cài qua npm nhưng chỉ chứa script JavaScript, không tự tải binary ffmpeg về:
```
WARNING: ffmpeg-location .../node_modules/ffmpeg-static/ffmpeg does not exist!
```

**Cách khắc phục:**  
Chạy script cài đặt binary thủ công:
```bash
node node_modules/ffmpeg-static/install.js
```

### 5b. `yt-dlp` phiên bản cũ
Version `2026.06.09` không còn tương thích với YouTube API mới.

**Cách khắc phục:**  
Cập nhật `yt-dlp` lên bản nightly mới nhất:
```bash
./yt-dlp --update-to nightly
```
→ Cập nhật thành công lên `nightly@2026.07.03.234421`.

---

## 6. Thiết lập tự động tắt Redis khi thoát backend

**Vấn đề:**  
Trước đây, khi dừng NestJS bằng `Ctrl+C`, Redis vẫn tiếp tục chạy ngầm trong nền gây tốn tài nguyên.

**Cách khắc phục:**  
Tạo file [`dev.sh`](./dev.sh) - script wrapper quản lý vòng đời Redis:
- **Khi bật**: Tự động start Redis → rồi mới chạy NestJS + Python.
- **Khi tắt** (`Ctrl+C` / `SIGTERM`): Bắt tín hiệu thoát, tự động `stop` Redis.

Thêm lệnh mới vào `package.json`:
```json
"dev:local": "bash ./dev.sh"
```

**Cách dùng từ nay:**
```bash
npm run dev:local
```

---

## Tổng kết

| # | Lỗi | Trạng thái |
|---|-----|-----------|
| 1 | Prisma invalid database URL (P1013) | ✅ Đã khắc phục |
| 2 | TypeScript: thiếu type từ Prisma Client | ✅ Đã khắc phục |
| 3 | ENCRYPTION_KEY bị trống | ✅ Đã khắc phục |
| 4 | Redis ECONNREFUSED port 6379 | ✅ Đã khắc phục |
| 5a | ffmpeg binary chưa tồn tại | ✅ Đã khắc phục |
| 5b | yt-dlp phiên bản cũ | ✅ Đã khắc phục |
| 6 | Redis không tắt cùng backend | ✅ Đã khắc phục |

---

## 📅 22/07/2026 — Messages, Pagination & Production Bugs

> Chi tiết đầy đủ: [fixes/2026-07-22-messages-pagination-production.md](./fixes/2026-07-22-messages-pagination-production.md)

| # | Lỗi | Severity | Trạng thái |
|---|-----|----------|------------|
| 7 | `tracks.filter is not a function` — double-nested API response | 🔴 Runtime | ✅ Fixed |
| 8 | Album list không hiển thị sau khi tạo | 🔴 Runtime | ✅ Fixed |
| 9 | Nút Invite hiển thị sai khi đang chat | 🟡 UI | ✅ Fixed |
| 10 | Gateway `static` Maps memory leak | 🔴 Production | ✅ Fixed |
| 11 | Presence broadcast lộ userId toàn bộ client | 🔴 Security | ✅ Fixed |
| 12 | Socket không re-join room sau reconnect | 🔴 Production | ✅ Fixed |
| 13 | `isSubscribed` flag chặn re-subscribe | 🟡 Logic | ✅ Fixed |
| 14 | ChatWindow `isPrepending` race condition | 🟡 UI | ✅ Fixed |
| 15 | Message pagination (infinite scroll up) | — Feature | ✅ Added |
| 16 | User online/offline presence indicator | — Feature | ✅ Added |
| 17 | Ẩn scrollbar toàn bộ frontend | 🟢 Polish | ✅ Fixed |
