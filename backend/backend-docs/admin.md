# Module: admin (Micro-Technical Detail)

Module `admin` cung cấp các API dành cho quản trị viên, chủ yếu để quản lý dữ liệu và hệ thống lưu trữ. Nó tích hợp trực tiếp với `SongsModule` và `StorageModule` để thực hiện các thao tác mức hệ thống.

---

## 1. Thành phần chính
- **Controller**: `src/admin/admin.controller.ts`
- **Module**: `src/admin/admin.module.ts`

*(Module này không có Service riêng mà trực tiếp gọi các Service/Repository từ các module khác).*

---

## 2. Chi tiết Controller (`AdminController`)

### `deleteTrack` (`DELETE tracks/:id`)
- **Impact**: Xóa cứng một bài hát khỏi cơ sở dữ liệu dựa trên ID.
- **In/Out**:
    - **In**: `id` (Param) - ID của bài hát cần xóa.
    - **Out**: Trả về kết quả từ Prisma `delete` operation.
- **Logic**: 
    - Gọi trực tiếp `this.songRepository.delete({ where: { id } })` để xóa bản ghi.

### `cleanupStorage` (`POST storage/cleanup`)
- **Impact**: Khởi chạy tiến trình dọn dẹp (xóa) một file cụ thể trên Cloud Storage (Supabase/S3). Trả về HTTP 200 OK ngay lập tức.
- **In/Out**:
    - **In**: `{ bucketName: string; path: string }` (Body) - Thông tin về bucket và đường dẫn file cần xóa.
    - **Out**: `{ message: 'Storage cleanup initiated', file: body.path }`
- **Logic**:
    - Gọi `this.storageCleanupService.cleanupFile(body.bucketName, body.path)`.
    - Trả về thông báo thành công.

---

## 3. Cấu trúc DTO (In/Out Shapes)

*(Các DTO được định nghĩa inline trong Controller)*
- **CleanupStorageBody**:
  - `bucketName`: `string`
  - `path`: `string`
