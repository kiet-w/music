---

# Admin Module — AI Coding Skill Context

> File này dùng làm context cho AI coding agent khi làm việc với Admin Module.

---

## 1. Kiến trúc tổng thể — Tại sao tổ chức như vậy?

```
HTTP Request
    │
    ▼
AdminController         ← Chỉ nhận/trả HTTP, KHÔNG chứa logic
    │
    ▼
AdminService            ← Toàn bộ business logic nằm ở đây
    │
    ▼
[SongRepository / StorageCleanupService] ← Chỉ giao tiếp với DB hoặc External Service
    │
    ▼
[Database / External Service]
```

**Tại sao tách các layer?**
- **Tách biệt mối quan tâm (Separation of Concerns):** `AdminController` chịu trách nhiệm định tuyến, validate DTO, và gửi/nhận HTTP response. Trong khi đó, `AdminService` làm cầu nối gọi đến các service khác như Repository (cho DB) hoặc `StorageCleanupService` (cho việc xóa file).
- **Tính module hóa (Modularity):** Module Admin đóng vai trò tổng hợp logic quản trị, thay vì nhét logic xóa bài hát vào `SongsController` hay logic xóa file vào `StorageController`. Điều này giúp quản lý tính năng quản trị một cách tập trung.

---

## 2. Các Dependencies

| Dependency | Vai trò |
|------------|---------|
| `SongsModule` | Cung cấp `SongRepository` để Admin có thể xóa bài hát trong cơ sở dữ liệu. |
| `StorageModule` | Cung cấp `StorageCleanupService` để thực hiện hành động xóa các file rác/hỏng trên bucket. |
| `SongRepository` | Tầng tương tác trực tiếp với cơ sở dữ liệu cho thực thể `Song`. |
| `StorageCleanupService` | Dịch vụ để tương tác với hệ thống lưu trữ object/file. |

---

## 3. Entry Points — Đi đâu về đâu

### DELETE /admin/tracks/:id

```
Client gửi: DELETE request với param id
    │
    ▼ Controller.deleteTrack(id)
    │   → Định nghĩa endpoint, trích xuất Param id
    │
    ▼ Service.deleteTrack(id)
    │   1. Gọi songRepository.delete với tham số id
    │
    ▼ Trả về: { [thông tin bản ghi bài hát vừa bị xóa] }

Lỗi có thể xảy ra:
- [404] Prisma RecordNotFound → khi id không tồn tại trong DB.
```

### POST /admin/storage/cleanup

```
Client gửi: { bucketName: string, path: string } (Body: CleanupStorageDto)
    │
    ▼ Controller.cleanupStorage(cleanupDto)
    │   → Định nghĩa endpoint, parse và validate Body
    │
    ▼ Service.cleanupStorage(dto)
    │   1. Gọi StorageCleanupService.cleanupFile để thực sự xóa file ở tầng Storage
    │
    ▼ Trả về: { message: "Storage cleanup initiated", file: path }

Lỗi có thể xảy ra:
- [400] BadRequestException → khi body thiếu thông tin bucketName hoặc path do ValidationPipe bắt.
- [500] InternalServerError → khi quá trình xóa file trên bucket bị lỗi.
```

---

## 4. Đánh giá — Đã tốt chưa?

### ✅ Đã làm tốt

| Điểm tốt | Lý do |
|----------|-------|
| Controller mỏng, Service rõ ràng | Logic được tách riêng ra khỏi Controller, Controller chỉ parse request và trả về thông tin. |
| Định nghĩa DTO rõ ràng | Sử dụng `@IsString()` và `@IsNotEmpty()` để validate đầu vào cho API `cleanupStorage`. |
| Tái sử dụng Module khác | Admin Module sử dụng lại `SongRepository` và `StorageCleanupService` từ các module khác, đảm bảo tính DRY. |

### ❌ Chưa tốt / Cần cải thiện

**1. Thiếu Guard / Bảo mật phân quyền**
```typescript
// HIỆN TẠI — vấn đề:
// Các endpoint admin hoàn toàn public, bất kỳ ai cũng có thể gọi xóa bài hát hoặc dọn dẹp storage.
@Controller('admin')
export class AdminController {}

// NÊN SỬA — lý do:
// Cần thêm JwtAuthGuard và RolesGuard để đảm bảo chỉ những người có quyền (ADMIN) mới truy cập được.
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {}
```

**2. Xử lý lỗi (Error Handling)**
```typescript
// HIỆN TẠI:
// deleteTrack gọi thẳng vào repository xóa, nếu ID không tồn tại có thể ném Prisma Error không thân thiện.
async deleteTrack(id: string) {
  return this.songRepository.delete({ where: { id } });
}

// NÊN SỬA:
// Cần kiểm tra xem entity có tồn tại không trước khi xóa, hoặc catch lỗi Prisma để trả về 404 (NotFoundException).
async deleteTrack(id: string) {
  try {
    return await this.songRepository.delete({ where: { id } });
  } catch (error) {
    throw new NotFoundException(`Track with id ${id} not found`);
  }
}
```

---

## 5. API Design Review

### Endpoint Naming
```
DELETE /admin/tracks/:id         [✅] Chuẩn RESTful, xác định tài nguyên cụ thể để xóa.
POST   /admin/storage/cleanup    [✅] Hành động rõ ràng, phản ánh đúng chức năng.
```

### Response Shape
```typescript
// Endpoint POST /admin/storage/cleanup trả về:
{
  message: string,  // Trạng thái thao tác ("Storage cleanup initiated")
  file: string      // Đường dẫn file vừa được dọn dẹp
}
```

### HTTP Status Codes
```
DELETE /admin/tracks/:id      → 200 OK  [⚠️] Tốt nhất nên trả về 204 No Content.
POST   /admin/storage/cleanup → 200 OK  [✅] Dùng @HttpCode(HttpStatus.OK) hợp lý.
```

---

## 6. Cách Debug khi gặp lỗi

### Lỗi Prisma/Repository khi xóa bài hát

```
Checklist:
1. Đảm bảo id truyền vào tồn tại trong cơ sở dữ liệu.
2. Kiểm tra xem có khóa ngoại (foreign key constraint) từ các bảng khác trỏ vào bài hát không (ví dụ: Playlist, Likes).

Command debug:
→ Chạy câu query SELECT trên DB bằng Prisma Studio: `npx prisma studio` để check ID.
```

### Lỗi Xóa File trên Storage

```
Checklist:
1. Kiểm tra xem bucketName và path được truyền vào có chính xác không.
2. Đảm bảo cấu hình biến môi trường kết nối đến Storage (ví dụ S3, Google Cloud) là hợp lệ.

Log sẽ hiện: Error trong quá trình gọi hàm của StorageCleanupService. Cần kiểm tra log error của backend.
```

---

## 7. Các Pattern quan trọng trong module này

### Pattern 1: Tái sử dụng Service qua Module Imports
```typescript
// Tại sao dùng pattern này?
// → Tránh viết lại logic thao tác DB của Entity Song hay logic gọi API Storage. Quản trị phân chia theo Module và Export/Import.

@Module({
  imports: [SongsModule, StorageModule],
  // ...
})
export class AdminModule {}

// Nếu KHÔNG dùng pattern này thì sao?
// → Sẽ có Code Duplicate khi phải tự viết lại cấu hình hoặc import trực tiếp từ bên ngoài mà không thông qua Nest Dependency Injection.
```

---

## 8. Biến môi trường cần thiết

```env
# Module này không trực tiếp sử dụng biến môi trường, 
# nhưng phụ thuộc vào các Module khác như StorageModule và Database:
DATABASE_URL=          # Dùng cho SongRepository để kết nối DB
STORAGE_BUCKET=        # Dùng cho StorageCleanupService (nếu có cấu hình mặc định)
```

---

## 9. Khi AI agent làm việc với module này

**Trước khi thêm feature mới:**
- Luôn kiểm tra xem tính năng định thêm có phù hợp thuộc về `AdminModule` hay không, nếu nó chỉ là CRUD thông thường, cân nhắc đặt vào module chính (VD: `SongsModule`).

**Khi sửa phần nhạy cảm của module:**
- Cần chú ý thêm ngay các Guard xác thực, vì đây là Admin route.
- Khi gọi đến DB, luôn chú ý bắt lỗi 404 để có HTTP Response thân thiện.

**Khi thêm endpoint mới:**
- Đảm bảo tiền tố là `/admin/...` để gom cụm các api quản trị.
- Áp dụng DTO validation bằng class-validator để tránh rác dữ liệu.

**Khi debug:**
- Bắt đầu debug bằng cách xem lỗi ở `AdminController` hoặc xem có bị lỗi dependency injection trong `AdminModule` hay không (thường gặp khi module con thiếu export).
