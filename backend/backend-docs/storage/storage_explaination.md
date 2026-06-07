---

# Storage Module — AI Coding Skill Context

> File này dùng làm context cho AI coding agent khi làm việc với Storage Module.

---

## 1. Kiến trúc tổng thể — Tại sao tổ chức như vậy?

```
Other Services (e.g. AudioService)
    │
    ▼ (Injects 'IStorageProvider')
StorageService              ← Tương tác trực tiếp với Supabase Storage SDK.
    │
    ▼
[Supabase Storage]          ← Lưu trữ vật lý
```

**Tại sao tách các layer?**
- **Dependency Inversion:** Bằng cách định nghĩa `IStorageProvider` và dùng custom provider (`useExisting: StorageService`), các module khác chỉ phụ thuộc vào Interface chứ không phụ thuộc trực tiếp vào `StorageService` hay Supabase. Nếu sau này hệ thống muốn đổi sang AWS S3 hoặc MinIO, chỉ cần tạo `S3StorageService` implement `IStorageProvider` và thay đổi ở `StorageModule` mà không ảnh hưởng tới bất kỳ chỗ nào khác.
- **Tách biệt logic dọn dẹp:** `StorageCleanupService` được tách riêng để xử lý các logic cleanup (có thể mở rộng thêm retry, cronjob dọn file rác) thay vì nhồi nhét vào `StorageService`.

---

## 2. Các Dependencies

| Dependency | Vai trò |
|------------|---------|
| `ConfigService` | Lấy các biến môi trường cấu hình như `SUPABASE_URL`, `SUPABASE_KEY`. |
| `PinoLogger` | Ghi log chuẩn cấu trúc quá trình upload/delete hoặc lỗi cấu hình Supabase. |
| `IStorageProvider` | Interface trừu tượng giúp loose coupling (trong module này được implement bởi StorageService). |

---

## 3. Entry Points — Đi đâu về đâu

<!-- Các phương thức này thường được gọi từ Service khác, không phải HTTP Controller -->

### Function: upload / uploadBuffer / uploadStream

```
Caller (Ví dụ: AudioService) truyền file/buffer/stream
    │
    ▼ StorageService.upload...()
    │   1. Đọc file (nếu là path)
    │   2. Gọi supabase.storage.from(bucket).upload()
    │   3. Log thành công hoặc bắt lỗi ném InternalServerErrorException
    │
    ▼ Trả về: string (đường dẫn path của file trên Supabase)

Lỗi có thể xảy ra:
- 500 InternalServerErrorException → Upload thất bại do lỗi mạng, sai quyền bucket, file quá lớn.
```

### Function: cleanupFile

```
Caller (Ví dụ: Cronjob hoặc Error Rollback handler) truyền bucket và path
    │
    ▼ StorageCleanupService.cleanupFile()
    │   1. Ghi log khởi tạo cleanup.
    │   2. Gọi IStorageProvider.delete()
    │
    ▼ StorageService.delete()
    │   1. Gọi supabase.storage.from().remove()
    │
    ▼ Trả về: void

Lỗi có thể xảy ra:
- 500 InternalServerErrorException → Xóa file không thành công trên Supabase.
```

---

## 4. Đánh giá — Đã tốt chưa?

### ✅ Đã làm tốt

| Điểm tốt | Lý do |
|----------|-------|
| Áp dụng Dependency Inversion (DI) | Cung cấp custom provider cho `IStorageProvider` giúp hệ thống linh hoạt và dễ mock khi viết Unit Test. |
| Xử lý đa dạng input | Hỗ trợ upload từ local path, memory buffer, hoặc network stream, phù hợp với nhiều use case khác nhau. |
| Error Handling & Logging | Chuyển đổi lỗi của SDK Supabase thành HttpException chuẩn của NestJS (`InternalServerErrorException`) kèm theo logging đầy đủ qua Pino. |

### ❌ Chưa tốt / Cần cải thiện

**1. Hardcode Content-Type mặc định**
```typescript
// HIỆN TẠI — vấn đề:
async upload(filePath: string, bucketName: string, destinationPath: string)
// ... contentType: 'audio/mpeg' ...

// NÊN SỬA — lý do:
// File có thể là hình ảnh (image/png) hoặc định dạng khác, không nên fix cứng 'audio/mpeg'. Nên nhận định dạng từ tham số hoặc đoán qua extension file.
```

**2. Khởi tạo Supabase Client với URL giả mạo khi thiếu Config**
```typescript
// HIỆN TẠI — vấn đề:
this.supabase = createClient(
  isConfigured ? rawUrl! : 'https://placeholder.supabase.co',
  isConfigured ? rawKey! : 'placeholder-key',
);

// NÊN SỬA — lý do:
// Nếu server chạy thiếu config, nó sẽ im lặng sử dụng URL giả và nổ lỗi lúc runtime khi thực sự gọi upload. Thay vào đó, nên ném Error ngay lập tức lúc khởi động app (constructor) để DevOps biết cấu hình sai.
```

---

## 5. API Design Review

*(Module này không expose HTTP API trực tiếp, chỉ expose Service Methods cho internal use)*

### Function Interface Design
```typescript
// Các hàm upload trả về string (path) là thiết kế tốt, giúp caller có thể lưu path đó vào DB và sau này dùng hàm getPublicUrl để phân phối URL cho Client thay vì lưu Hardcode URL trong DB.
```

---

## 6. Cách Debug khi gặp lỗi

### Lỗi 500 InternalServerErrorException khi Upload/Delete

```
Checklist:
1. Kiểm tra lại thông tin `SUPABASE_URL` và `SUPABASE_KEY` trong file `.env`.
2. Kiểm tra `bucketName` truyền vào có tồn tại và đúng chính tả trên Supabase Dashboard chưa.
3. Kiểm tra Policy (RLS - Row Level Security) của Storage Bucket trên Supabase đã cho phép quyền INSERT/DELETE chưa.

Command debug:
→ Xem log của Pino trên server để lấy message lỗi nguyên bản từ phía Supabase API.
```

---

## 7. Các Pattern quan trọng trong module này

### Pattern 1: Interface-based Provider (Dependency Inversion)
```typescript
// Tại sao dùng pattern này?
// → Giúp dễ thay thế (ví dụ chuyển sang AWS S3) và mock trong lúc viết unit test.
@Module({
  providers: [
    StorageService,
    {
      provide: 'IStorageProvider',
      useExisting: StorageService,
    },
  ],
})

// Khi Service khác dùng, chỉ cần inject interface:
constructor(@Inject('IStorageProvider') private readonly storage: IStorageProvider) {}
```

---

## 8. Biến môi trường cần thiết

```env
SUPABASE_URL=          # Base URL của project Supabase (vd: https://xyz.supabase.co)
SUPABASE_KEY=          # Service Role Key hoặc Anon Key của Supabase dùng để xác thực quyền truy cập Storage
```

---

## 9. Khi AI agent làm việc với module này

**Trước khi thêm feature mới:**
- Bất kỳ tính năng giao tiếp nào với Storage Service ngoại vi (S3, Cloudinary...) nên tuân theo interface `IStorageProvider`. Thêm phương thức mới vào interface trước, sau đó mới implement vào `StorageService`.
- Nếu cập nhật Interface `IStorageProvider`, đảm bảo cập nhật đầy đủ file Mock và Service thực tế.

**Khi sửa phần nhạy cảm của module:**
- Luôn sử dụng try-catch và convert lỗi thành các `HttpException` (`InternalServerErrorException`) thay vì để lỗi gốc của các SDK gây crash luồng.
- Không xóa/sửa tham số `upsert: true` trong các method upload trừ khi hiểu rất rõ luồng lưu trữ file có bị ghi đè hay không.

**Khi debug:**
- Truy xuất log của file `storage.service.ts` để kiểm tra các tham số `bucketName` và `destinationPath` trước khi tiến hành check trên dashboard của Supabase.
