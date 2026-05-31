# Module: google-drive (Micro-Technical Detail)

Module `google-drive` chịu trách nhiệm tích hợp với API của Google Drive. Cho phép người dùng liệt kê các file âm thanh từ Drive của họ (bao gồm cả Shared Drives) và tải chúng về server để đưa vào hệ thống nghe nhạc.

---

## 1. Thành phần chính
- **Controller**: `src/google-drive/google-drive.controller.ts`
- **Service**: `src/google-drive/google-drive.service.ts`
- **DTOs**: `ImportDto`

---

## 2. Chi tiết Controller (`GoogleDriveController`)

### `ping` (`GET /ping`)
- **Impact**: Endpoint test health check đặc thù của module Google Drive.
- **In/Out**:
    - **In**: Không có.
    - **Out**: Trả về `{ status: 'ok', timestamp, version }`.

### `listFiles` (`GET /files`)
- **Impact**: Lấy danh sách các file audio từ Google Drive của user thông qua Google OAuth Token.
- **In/Out**:
    - **In**: `token` (Query Param) - Access Token của Google.
    - **Out**: Mảng thông tin file hoặc object chứa error log nếu thất bại.
- **Logic**:
    - Truyền trực tiếp token xuống `this.googleDriveService.listFiles(token)`.
    - Catch tất cả lỗi và in ra console thay vì ném exception mặc định của NestJS, đồng thời trả về object có chứa stack trace để dễ debug ở frontend.

### `importFile` (`POST /import`)
- **Impact**: Đây là luồng tích hợp quan trọng nhất. Nó tải file từ Google Drive, dọn dẹp tên file, lưu vào Supabase/S3 Storage, và tạo một bản ghi bài hát (Song) mới vào Database.
- **In/Out**:
    - **In**: `importDto` (Body: `fileId`, `accessToken`, `albumId`).
    - **Out**: Trả về đối tượng bài hát (`Song`) vừa tạo trong DB.
- **Luồng thực thi**:
    1. Gọi `getFileMetadata(accessToken, fileId)` để lấy thông tin gốc (tên, mimeType).
    2. Gọi `downloadFile(accessToken, fileId)` để tải nội dung file dưới dạng `Buffer`.
    3. **Micro-Logic (Sanitize Name)**:
       - `` `const sanitizedName = originalName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9.-]/g, '_');` ``
       - Loại bỏ dấu tiếng Việt và thay các ký tự đặc biệt bằng `_` để tạo ra filename an toàn khi upload lên Cloud Storage.
    4. Gọi `this.storageService.uploadBuffer(buffer, 'music', storagePath, metadata.mimeType)` để upload file âm thanh lên hệ thống lưu trữ tĩnh. Lấy URL public.
    5. Gọi `this.songRepository.create(...)` lưu thông tin bài hát vào CSDL.
       - Tên file giữ nguyên dấu (`originalName.replace(/\.[^/.]+$/, '')`) để hiển thị đẹp.

---

## 3. Chi tiết Service (`GoogleDriveService`)

Bao bọc SDK `googleapis`. Khởi tạo `oauth2Client` dùng `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

### `listFiles` (Public)
- **Impact**: Lấy toàn bộ file audio, bao gồm cả file được share từ người khác và shortcut.
- **Micro-Logic**:
    - Gán token tạm thời: `` `this.oauth2Client.setCredentials({ access_token: accessToken });` ``
    - Dùng query: `` `q: "trashed = false", supportsAllDrives: true, includeItemsFromAllDrives: true` `` để tìm kiếm không giới hạn không gian lưu trữ.
    - Lọc thủ công (`musicFiles`) các file có `mimeType` hoặc đuôi mở rộng (`.mp3`, `.wav`, `.flac`, v.v.) liên quan tới âm thanh.
    - **Xử lý Shortcut**: Nếu file là shortcut tới 1 audio file, nó sẽ map lại `id` bằng `targetId` và đánh dấu `isShortcut: true`.

### `getFileMetadata` (Public)
- **Impact**: Lấy thông tin meta (id, name, mimeType, size) của một file bất kỳ dựa trên `fileId`.

### `downloadFile` (Public)
- **Impact**: Tải file từ Drive bằng `ArrayBuffer` để đưa vào RAM (Buffer) của server.
- **Micro-Logic**:
    - `` `alt: 'media'` ``: Yêu cầu tải nội dung thực tế của file thay vì lấy thông tin meta.
    - `` `responseType: 'arraybuffer'` ``: Yêu cầu trả về dữ liệu nhị phân.
    - `` `return Buffer.from(res.data as ArrayBuffer);` ``: Ép sang `Buffer` của Node.js để có thể gửi qua service khác.

---

## 4. Cấu trúc DTO (In/Out Shapes)

### `ImportDto` (`src/google-drive/dto/import.dto.ts`)
- `fileId`: `string` (Validator: `@IsString`, `@IsNotEmpty`)
- `accessToken`: `string` (Validator: `@IsString`, `@IsNotEmpty`)
- `albumId`: `string` (Validator: `@IsString`, `@IsNotEmpty`)
