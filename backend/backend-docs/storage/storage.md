# Storage Module Documentation

## 1. Tổng quan Kiến trúc (Component Overview)
Module `Storage` chịu trách nhiệm xử lý toàn bộ các thao tác liên quan đến lưu trữ file của hệ thống. Thay vì lưu trữ trực tiếp trên server, module này sử dụng dịch vụ Supabase Storage như một S3-compatible bucket để upload file (từ path, buffer, stream), lấy public URL và xóa file. Ngoài ra, nó cung cấp một service chuyên biệt để dọn dẹp (cleanup) file.

## 2. Các Dependencies (Dependencies Injection)
- **`ConfigService`**: Truy xuất các biến môi trường cấu hình liên quan đến Supabase (`SUPABASE_URL`, `SUPABASE_KEY`).
- **`PinoLogger` (nestjs-pino)**: Dùng để ghi log quá trình khởi tạo, upload, và xóa file.
- **`IStorageProvider`**: Interface chuẩn hóa cho Storage Provider, trong module này được implement bởi `StorageService`.

## 3. Phân tích chi tiết Module & Service
### 3.1. StorageModule (`storage.module.ts`)
- Đăng ký `StorageService` và `StorageCleanupService`.
- Định nghĩa custom provider `{ provide: 'IStorageProvider', useExisting: StorageService }` để tiêm `StorageService` cho bất kỳ module nào cần `IStorageProvider`.
- Export `IStorageProvider`, `StorageCleanupService`, và `StorageService` ra ngoài để các module khác sử dụng.

### 3.2. StorageService (`storage.service.ts`)
- Implement interface `IStorageProvider`.
#### Các Private Methods:
- **`initializeSupabase()`**: Được gọi trong constructor. Đọc `SUPABASE_URL` và `SUPABASE_KEY` từ `ConfigService`. Kiểm tra tính hợp lệ của URL bằng `isValidUrl()`. Nếu không hợp lệ hoặc thiếu key, sẽ ghi log error. Cuối cùng, khởi tạo `SupabaseClient` (nếu thiếu config sẽ dùng fallback placeholder).
- **`isValidUrl(url: string)`**: Kiểm tra chuỗi có phải là URL `http` hoặc `https` hợp lệ hay không bằng cách parse qua class `URL` của Node.js.

#### Các Public Methods:
- **`upload(filePath: string, bucketName: string, destinationPath: string)`**: 
  - Đọc file từ local disk (`fs.promises.readFile`).
  - Gọi Supabase Client `upload` vào `bucketName` tại `destinationPath` (mặc định contentType 'audio/mpeg', upsert: true).
  - Trả về đường dẫn của file (path). Ném `InternalServerErrorException` nếu lỗi.
- **`uploadBuffer(buffer: Buffer, bucketName: string, destinationPath: string, contentType: string)`**:
  - Tương tự `upload` nhưng nhận dữ liệu đầu vào là `Buffer` và hỗ trợ truyền `contentType`.
- **`uploadStream(stream: any, bucketName: string, destinationPath: string, contentType: string)`**:
  - Tương tự nhưng nhận đầu vào là một `stream` thay vì buffer/path.
- **`getPublicUrl(bucketName: string, path: string)`**:
  - Gọi Supabase Client `getPublicUrl` để lấy URL công khai của file.
- **`delete(bucketName: string, path: string)`**:
  - Gọi Supabase Client `remove` để xóa mảng chứa `path` khỏi `bucketName`.

### 3.3. StorageCleanupService (`storage-cleanup.service.ts`)
#### Các Public Methods:
- **`cleanupFile(bucketName: string, path: string)`**:
  - Ghi log sự kiện dọn dẹp.
  - Gọi hàm `delete` của `IStorageProvider` (được inject thông qua custom provider) để thực hiện xóa file.
