# 🛠️ Fix Log #1 — Backend Setup & Infrastructure

> **Ngày:** 04/07/2026  
> **Phạm vi:** Backend NestJS, Prisma, Redis, yt-dlp, ffmpeg  
> **Trạng thái:** ✅ Tất cả đã khắc phục

---

## Fix 1 · Prisma: Invalid database URL (`P1013`)

**Triệu chứng:**
```
Error: P1013: The provided database string is invalid.
invalid domain character in database URL.
```

**Nguyên nhân:**  
File `.env` chứa placeholder mẫu có ký tự `[` và `]` trong URL:
```env
DATABASE_URL="postgresql://postgres.[THAY_BANG_PROJECT_REF]:[THAY_BANG_MAT_KHAU]@aws-0-[THAY_BANG_REGION].pooler.supabase.com:6543/postgres"
```

**Cách khắc phục:**  
Thay bằng thông tin thật từ Supabase Dashboard → Project Settings → Database:
```env
DATABASE_URL="postgresql://postgres.<REF>:<PASSWORD>@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.<REF>:<PASSWORD>@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

---

## Fix 2 · TypeScript: `UserRole`, `JobStatus`, `FriendRequest` không tồn tại trong `@prisma/client`

**Triệu chứng:**
```
error TS2305: Module '"@prisma/client"' has no exported member 'UserRole'.
error TS2305: Module '"@prisma/client"' has no exported member 'JobStatus'.
error TS2339: Property 'role' does not exist on type '{...}'.
```

**Nguyên nhân:**  
Lệnh `prisma db pull` ghi đè `schema.prisma` bằng cấu trúc database cũ (thiếu enum và model). Prisma Client generate ra các type sai/thiếu.

**Cách khắc phục:**
1. Khôi phục `schema.prisma` đầy đủ.
2. Reset và push schema mới:
   ```bash
   npx prisma db push --force-reset
   npx prisma generate
   ```
3. Khởi động lại NestJS để reload `node_modules/@prisma/client`.

---

## Fix 3 · Config: `ENCRYPTION_KEY` không được để trống

**Triệu chứng:**
```
Error: Config validation error: "ENCRYPTION_KEY" is not allowed to be empty
```

**Nguyên nhân:**  
Biến `ENCRYPTION_KEY` bị bỏ trống trong `.env`, `ConfigModule` của NestJS yêu cầu giá trị bắt buộc.

**Cách khắc phục:**  
Tạo chuỗi hex ngẫu nhiên 32-byte:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
```env
ENCRYPTION_KEY=<64-char-hex-string>
```

---

## Fix 4 · Redis: `ECONNREFUSED 127.0.0.1:6379` (BullMQ worker error)

**Triệu chứng:**
```
AggregateError [ECONNREFUSED]: connect ECONNREFUSED 127.0.0.1:6379
[BullMQ worker error]
```

**Nguyên nhân:**  
BullMQ yêu cầu Redis đang chạy ở port 6379, nhưng Redis chưa được khởi động. Mật khẩu Redis trong `.env` không khớp với Redis local (không có password mặc định).

**Cách khắc phục:**
```bash
sudo systemctl enable --now redis-server
```
Xóa password trong `.env`:
```env
REDIS_PASSWORD=
```

---

## Fix 5a · ffmpeg: binary không tồn tại

**Triệu chứng:**
```
WARNING: ffmpeg-location .../node_modules/ffmpeg-static/ffmpeg does not exist!
```

**Nguyên nhân:**  
Package `ffmpeg-static` chỉ cài JavaScript wrapper, không tự tải binary về khi cài qua npm trên Linux.

**Cách khắc phục:**
```bash
node node_modules/ffmpeg-static/install.js
# → Download ffmpeg b6.1.1 (~76MB)
```

---

## Fix 5b · yt-dlp: phiên bản cũ không tải được YouTube

**Triệu chứng:**
```
ERROR: [DownloaderService] [Downloader] Unexpected error
💥 ERROR trong SECTION [YouTube Conversion] - Job Processing
```

**Nguyên nhân:**  
`yt-dlp` version `2026.06.09` không còn tương thích với YouTube API mới (YouTube thay đổi API thường xuyên).

**Cách khắc phục:**
```bash
./yt-dlp --update-to nightly
# → Updated to nightly@2026.07.03.234421
```

---

## Fix 6 · Redis không tắt cùng backend

**Vấn đề:**  
Khi dừng NestJS bằng `Ctrl+C`, Redis vẫn chạy ngầm gây tốn tài nguyên.

**Cách khắc phục:**  
Tạo `backend/dev.sh` — script wrapper bắt `SIGINT`/`SIGTERM`, tự động dừng Redis khi thoát.

```bash
# Dùng lệnh này thay cho npm run start:dev
npm run dev:local
```

---

## Tổng kết

| Fix | Mô tả | Trạng thái |
|-----|-------|-----------|
| 1 | Prisma invalid database URL (P1013) | ✅ |
| 2 | TypeScript: thiếu type từ Prisma Client | ✅ |
| 3 | ENCRYPTION_KEY bị trống | ✅ |
| 4 | Redis ECONNREFUSED port 6379 | ✅ |
| 5a | ffmpeg binary chưa tồn tại | ✅ |
| 5b | yt-dlp phiên bản cũ | ✅ |
| 6 | Redis không tắt cùng backend | ✅ |
