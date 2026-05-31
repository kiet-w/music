# Hệ thống Backend Music Player - Tài liệu Kỹ thuật Chi tiết (Micro-Technical Detail)

Tài liệu này cung cấp cái nhìn toàn diện về kiến trúc backend, luồng dữ liệu, và logic nghiệp vụ vi mô của từng module trong thư mục `src/`.

---

## 1. Module: Songs (Quản lý Bài hát & YouTube)
Quản lý metadata bài hát và khởi tạo quy trình tải nhạc từ YouTube.

- **Controller**: `src/songs/song.controller.ts`
- **Service**: `src/songs/song.service.ts`
- **Repository**: `src/songs/repositories/song.repository.ts`
- **DTOs**:
    - `CreateSongYoutubeDto`: `url` (YouTube), `title`, `artist`?, `albumId`?
    - `SongResponseDto`: Trả về dữ liệu bài hát đã được transform qua `ClassSerializer`.

### Controller (`SongController`)
- **Impact**: Khai báo các endpoint `/songs`. Sử dụng `ClassSerializerInterceptor` để tự động lọc dữ liệu qua `SongResponseDto`.
- **In/Out**:
    - **In**: `CreateSongYoutubeDto` (Post), `id` (Param), `albumId` (Body - Patch).
    - **Out**: `SongResponseDto` | `SongResponseDto[]`.

### Service (`SongService`)
- **Impact**: Điều phối tạo metadata và kích hoạt background job. Quyết định album mặc định.
- **Micro-Logic**:
    - `if (!finalAlbumId) { ... }` — Tự động tìm hoặc tạo album "Default" nếu người dùng không chọn album, đảm bảo tính toàn vẹn của khóa ngoại `albumId`.
    - `this.conversionQueue.add('convert', { url, songId })` — Tách biệt quy trình download nặng nề ra khỏi HTTP request/response cycle.
- **In/Out**:
    - **In**: Metadata bài hát từ Controller.
    - **Out**: `Track` entity (Prisma).

### Repository (`SongRepository`)
- **Impact**: Kế thừa `BaseRepository`. Phụ trách thao tác trên bảng `Track`.

---

## 2. Module: Albums (Quản lý Album)
Quản lý các bộ sưu tập bài hát và thống kê số lượng track.

- **Controller**: `src/albums/album.controller.ts`
- **Service**: `src/albums/album.service.ts`
- **Repository**: `src/albums/repositories/album.repository.ts`
- **DTOs**:
    - `CreateAlbumDto`: `title`, `artist`?, `coverUrl`?
    - `AlbumResponseDto`: Metadata album kèm danh sách bài hát và `_count`.

### Service (`AlbumService`)
- **Impact**: Xử lý logic gộp dữ liệu và mapping thống kê.
- **Micro-Logic**:
    - `_count: { select: { tracks: true } }` — Sử dụng tính năng đếm tối ưu của Prisma tại tầng DB.
    - `songs: album._count?.tracks || 0` — Mapping lại key `tracks` thành `songs` cho Frontend.

---

## 3. Module: Pipeline Chuyển đổi (Downloader, Storage & Jobs)
Hệ thống xử lý media cốt lõi: tải nhạc, lưu trữ và cập nhật trạng thái.

### Jobs (`ConversionProcessor`)
- **Impact**: Thực thi tuần tự quy trình chuyển đổi âm nhạc bất đồng bộ.
- **Micro-Logic (5 bước)**:
    1. `downloaderService.download(url, outputPath)` — Tải và convert sang MP3.
    2. `storageService.upload(outputPath, 'music', storagePath)` — Đẩy file lên Supabase.
    3. `storageService.getPublicUrl(...)` — Lấy link stream.
    4. `prisma.track.update(...)` — Cập nhật link vào DB.
    5. `downloaderService.cleanup(outputPath)` — Xóa file tạm tại local.

### Downloader Service (`DownloaderService`)
- **Impact**: Bao bọc lệnh `yt-dlp` CLI để trích xuất âm thanh chất lượng MP3.
- **Micro-Logic**:
    - `` `yt-dlp -x --audio-format mp3 -o "${outputPath}" "${url}"` `` — Cấu hình tối ưu cho việc trích xuất audio.

### Storage Service (`StorageService`)
- **Impact**: Quản lý upload/delete file trên Supabase Storage.
- **Micro-Logic**:
    - `upsert: true` — Đảm bảo không lỗi nếu upload lại file cùng ID.
    - `isValidUrl(...)` — Kiểm tra cấu hình URL Supabase ngay khi khởi tạo class.

---

## 4. Module: Google Drive (Nhập nhạc từ Drive)
Nhập nhạc trực tiếp từ Google Drive cá nhân hoặc Shared Drives.

- **Controller**: `src/google-drive/google-drive.controller.ts`
- **Service**: `src/google-drive/google-drive.service.ts`
- **DTO**: `ImportDto` (`fileId`, `accessToken`, `albumId`)

### Service (`GoogleDriveService`)
- **Impact**: Duyệt và tải file qua Google Drive API v3.
- **Micro-Logic**:
    - `q: "trashed = false"` — Chỉ lấy file hiện hữu.
    - `isShortcutToAudio = ...` — Tự động phân giải Shortcut dẫn đến file âm nhạc.
    - `acknowledgeAbuse: true` — Bỏ qua cảnh báo virus của Google cho các file dung lượng lớn khi tải.

---

## 5. Module: Common & Infrastructure
Các thành phần dùng chung và hạ tầng hệ thống.

### Base Repository (`BaseRepository`)
- **Impact**: Lớp trừu tượng cho các Repository, ủy quyền (delegate) các lệnh CRUD cơ bản cho Prisma.

### Filters & Interceptors
- **HttpExceptionFilter**: Chuẩn hóa lỗi trả về (StatusCode, Message, Timestamp, Path).
- **LoggingInterceptor**: Ghi log thời gian xử lý của mỗi request HTTP.

### Prisma Service (`PrismaService`)
- **Impact**: Quản lý kết nối PostgreSQL.
- **Mandate**: Kết nối qua Port **6543** để sử dụng Transaction Pooler của Supabase, tránh lỗi tràn connection.

---

## 6. Module: Admin (Quản trị)
Cung cấp các API dọn dẹp và quản lý dữ liệu mức hệ thống.

- **Controller**: `src/admin/admin.controller.ts`
- **Impact**: Xóa track từ DB và kích hoạt dọn dẹp file từ Storage qua `StorageCleanupService`.

---

## 7. Chi tiết DTO & Interfaces
Các shape dữ liệu đảm bảo tính toàn vẹn và bảo mật.

### `SongResponseDto`
- `id`: string
- `title`: string
- `artist`: string | null
- `url`: string (Link streaming)
- `albumId`: string
- `sourceType`: 'youtube' | 'google-drive'

### `ImportDto`
- `fileId`: string
- `accessToken`: string
- `albumId`: string
