# Module: storage (Micro-Technical Detail)

Module `storage` đóng gói toàn bộ logic tương tác với các hệ thống Cloud Storage (hiện tại đang sử dụng Supabase Storage). Bằng việc implement `IStorageProvider`, module này cho phép dễ dàng swap sang AWS S3 hoặc Google Cloud Storage trong tương lai mà không ảnh hưởng tới logic của các module khác.

---

## 1. Thành phần chính
- **Services**: `src/storage/storage.service.ts`, `src/storage/storage-cleanup.service.ts`
- **Module**: `src/storage/storage.module.ts`

---

## 2. Chi tiết Module (`StorageModule`)

- **Impact**: Cấu hình Dependency Injection (DI) để map `StorageService` vào interface `IStorageProvider`.
- **Micro-Logic**:
    - Sử dụng custom provider `{ provide: 'IStorageProvider', useExisting: StorageService }`. Điều này giúp các service khác (như `StorageCleanupService`) có thể inject bằng `@Inject('IStorageProvider')` thay vì phụ thuộc trực tiếp vào class `StorageService`.

---

## 3. Chi tiết Service (`StorageService`)

Đây là trung tâm giao tiếp với Supabase API.

### Khởi tạo (`constructor`)
- Lấy `SUPABASE_URL` và `SUPABASE_KEY` từ biến môi trường.
- **Validation**: Kiểm tra tính hợp lệ của URL bằng `new URL(url)` và chặn các protocol không phải http/https.
- **Fail-safe**: Nếu thiếu biến môi trường, nó sẽ log ra lỗi thay vì crash app, và tạo một client kết nối tới `placeholder.supabase.co` để các phần khác của app vẫn compile/chạy được (tuy nhiên sẽ lỗi khi gọi upload thực tế).

### `upload` (Public)
- **Impact**: Đọc file từ ổ cứng server và đẩy lên Supabase.
- **Micro-Logic**:
    - `` `if (!fs.existsSync(filePath))` `` — Chặn lỗi trước khi đọc.
    - `` `const fileBuffer = fs.readFileSync(filePath);` `` — Tải toàn bộ file vào RAM (Lưu ý: Không tối ưu nếu file quá lớn, > vài GB).
    - `` `await this.supabase.storage.from(bucketName).upload(destinationPath, fileBuffer, { contentType: 'audio/mpeg', upsert: true });` `` — Upload với cờ `upsert: true` (ghi đè nếu file trùng tên). Mặc định ép kiểu `audio/mpeg`.

### `uploadBuffer` (Public)
- **Impact**: Nhận trực tiếp Buffer (từ Google Drive hoặc memory) để upload, bỏ qua bước trung gian lưu ra file tạm.
- **Micro-Logic**: Tương tự `upload` nhưng nhận tham số `contentType` động (ví dụ `audio/wav`).

### `getPublicUrl` (Public)
- **Impact**: Lấy link download trực tiếp của một file trong Storage.
- **Micro-Logic**: Gọi hàm đồng bộ `getPublicUrl` của Supabase (không cần `await` kết nối mạng, nó tự generate dựa trên logic URL public).

### `delete` (Public)
- **Impact**: Xóa cứng file trên Storage.

---

## 4. Chi tiết Service Phụ (`StorageCleanupService`)

### `cleanupFile`
- **Impact**: Đóng vai trò như một wrapper tiện ích để các module khác (như `AdminModule`) có thể gọi xóa file mà không cần quan tâm chi tiết.
- **Micro-Logic**: Gọi `this.storageProvider.delete(bucketName, path);`. Sử dụng `@Inject('IStorageProvider')` để tuân thủ Dependency Inversion.
