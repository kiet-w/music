---

# Jobs Module — AI Coding Skill Context

> File này dùng làm context cho AI coding agent khi làm việc với Jobs Module.

---

## 1. Kiến trúc tổng thể — Tại sao tổ chức như vậy?

```
Bên gọi (Controller/Service khác)  ← Gọi queue.add() để đẩy công việc
    │
    ▼
[Redis Server]                  ← Hàng đợi trung gian giữ tác vụ
    │
    ▼
JobsModule                      ← Cấu hình kết nối Redis và định nghĩa Worker
    │
    ▼
ConversionProcessor             ← Worker lấy tác vụ và thực thi logic nặng (Process)
    │
    ├──► DownloaderService      ← Tải từ YouTube về đĩa
    ├──► StorageService         ← Stream file lên Storage Cloud
    └──► PrismaService          ← Cập nhật kết quả vào Database
```

**Tại sao tách các layer?**
- **Bất đồng bộ (Asynchronous processing):** Tác vụ tải YouTube và đẩy lên storage có thể mất từ vài giây đến hàng phút. Không thể chờ bằng HTTP Request thông thường, nên việc đẩy tác vụ vào BullMQ (Redis) giúp phản hồi lại client ngay lập tức, trong khi xử lý chạy ngầm.
- **Microservice/Worker pattern:** Việc xử lý job được tách vào processor riêng (`WorkerHost`). Điều này cho phép mở rộng (scale) ứng dụng bằng cách chạy nhiều worker process độc lập nhau mà không lo tắc nghẽn server web chính.
- **Bộ nhớ hiệu quả:** Logic stream qua `StorageService.uploadStream` thay vì tải về RAM giúp tránh Out Of Memory (OOM).

---

## 2. Các Dependencies

| Dependency | Vai trò |
|------------|---------|
| `BullModule` | Kết nối với Redis và đăng ký/cung cấp Queue (hàng đợi) cũng như Worker. |
| `DownloaderService` | Xử lý việc tải file audio từ một URL bên ngoài (YouTube) về ổ cứng lưu tạm thời, và xóa file khi hoàn tất. |
| `StorageService` | Tương tác với dịch vụ Storage (như Supabase) để upload file nhạc (stream) và sinh ra đường dẫn có thể truy cập công khai. |
| `PrismaService` | Truy cập Database để cập nhật đường dẫn bài hát cuối cùng vào bảng `Track` sau khi tải thành công. |
| `PinoLogger` | Ghi chú log theo ngữ cảnh của job (songId, userId), giúp dễ dàng theo dõi lỗi trong background job. |

---

## 3. Entry Points — Đi đâu về đâu

### Background Job Worker / Queue: `conversion`

```
BullMQ phân phối job: { url, songId, userId }
    │
    ▼ ConversionProcessor.process(job)
    │   → Xử lý tuần tự quá trình chuyển đổi và tải lên.
    │
    ▼ Service calls:
    │   1. fs.mkdirSync — Tạo thư mục tạm lưu file để xử lý cục bộ.
    │   2. DownloaderService.download(url, outputPath) — Tải bài hát từ YouTube xuống file hệ thống.
    │   3. fs.createReadStream — Đọc file thành stream để tiết kiệm RAM.
    │   4. StorageService.uploadStream — Đẩy stream trực tiếp lên Object Storage.
    │   5. StorageService.getPublicUrl — Trích xuất link public của file vừa tải.
    │   6. PrismaService.track.update() — Ghi public URL vào cơ sở dữ liệu cho songId tương ứng.
    │   7. DownloaderService.cleanup(outputPath) — Dọn dẹp ổ đĩa cục bộ.
    │
    ▼ Trả về: { storagePath, publicUrl } (đánh dấu cho BullMQ là Job hoàn tất thành công)

Lỗi có thể xảy ra:
- [Exception] ở bất kỳ bước nào → Catch block kích hoạt.
- logger.error → Ghi log chi tiết.
- DownloaderService.cleanup() → Dọn rác (đảm bảo không bị rò rỉ dung lượng ổ cứng dù lỗi).
- Ném lại lỗi (throw) để hệ thống Queue đánh dấu thất bại.
```

---

## 4. Đánh giá — Đã tốt chưa?

### ✅ Đã làm tốt

| Điểm tốt | Lý do |
|----------|-------|
| Sử dụng Streaming để Upload | Tạo `fs.createReadStream` thay vì đọc vào memory (Buffer) giúp ứng dụng không bị crash vì tràn RAM khi file nhạc lớn hoặc xử lý nhiều job cùng lúc. |
| Quản lý tài nguyên File hiệu quả | Logic `cleanup()` được đặt cẩn thận ở cả luồng thành công và luồng lỗi (try-catch), đảm bảo ổ cứng không bị đầy (leak storage) sau thời gian dài hoạt động. |
| Sử dụng hệ thống Queue chuẩn (BullMQ) | Đảm bảo tính ổn định, tự động retry, theo dõi trạng thái job dễ dàng, và tránh block HTTP request. |

### ❌ Chưa tốt / Cần cải thiện

**1. Đường dẫn thư mục temp Hardcode**
```typescript
// HIỆN TẠI — vấn đề:
const tempDir = path.join(process.cwd(), 'temp');
// Việc gán trực tiếp tên thư mục tạm trong thư mục làm việc không tốt. Trong môi trường Container (Docker) hoặc các hệ thống Read-Only, thư mục này có thể không được cấp quyền ghi.

// NÊN SỬA — lý do:
// Nên sử dụng package `os` mặc định của Node.js hoặc thông qua biến môi trường để trỏ tới thư mục TMP chuẩn của OS.
import * as os from 'os';
const tempDir = path.join(os.tmpdir(), 'music-conversion');
```

**2. Không có logic cập nhật trạng thái lỗi vào DB**
```typescript
// HIỆN TẠI:
} catch (error) {
  this.logger.error({ songId, userId, error: error.message }, 'Job failed');
  await this.downloaderService.cleanup(outputPath);
  throw error;
}

// NÊN SỬA:
// Ngoài việc throw lỗi cho BullMQ, nên update DB để UI có thể hiển thị trạng thái "FAILED" cho người dùng.
} catch (error) {
  // ... (như cũ)
  await this.prisma.track.update({
    where: { id: songId },
    data: { status: 'FAILED', error: error.message }, // Cần thêm enum/trường này vào schema
  });
  throw error;
}
```

---

## 5. API Design Review

### Endpoint Naming
*(Không áp dụng cho Background Job / Worker Processor. Job queue name: `conversion` là hợp lý và đúng nghĩa)*

### Response Shape
```typescript
// Kết quả trả về của worker process:
{
  storagePath: string,  // Đường dẫn trong hệ thống cloud (dùng nội bộ nếu cần xóa/cập nhật)
  publicUrl: string,    // Link CDN để frontend chạy file audio
}
```

### HTTP Status Codes
*(Không áp dụng vì đây là Worker chạy nền, không qua HTTP)*

---

## 6. Cách Debug khi gặp lỗi

### Lỗi Worker không chạy (Job stuck ở trạng thái 'waiting' hoặc 'delayed')

```
Checklist:
1. Redis Server có đang chạy không?
2. Biến môi trường REDIS_HOST và REDIS_PORT có đúng không? (Nếu dùng localhost mà chạy qua Docker có thể không map đúng).
3. Đã có module nào import `JobsModule` chưa?
4. NestJS Server đã được start chưa (Worker nằm chung với backend hay nằm ở service khác?).

Command debug:
→ rtk env | grep REDIS
→ Kiểm tra qua Redis CLI: `redis-cli ping`
→ Cài đặt Bull-Board hoặc công cụ quản lý Redis (như RedisInsight) để xem các queue và jobs hiện có.
```

### Lỗi Quá trình Tải / Upload thất bại (Job rơi vào trạng thái 'failed')

```
Checklist:
1. Kiểm tra URL bài hát (YouTube) có hợp lệ hoặc có bị hạn chế vùng (Region block / Age restriction) không.
2. Kiểm tra Supabase Storage (hoặc dịch vụ liên quan) có đầy hoặc cấu hình kết nối có sai không.
3. Kiểm tra cấp quyền (Permissions) trên thư mục gốc cho ứng dụng để ghi vào `./temp`.

Log sẽ hiện: "Job failed" + bao gồm `songId`, `userId`, `error.message` (in ra từ Pino Logger). Xem chi tiết log này để xác định vị trí lỗi cụ thể.
```

---

## 7. Các Pattern quan trọng trong module này

### Pattern 1: Worker/Queue Pattern (với BullMQ)
```typescript
// Tại sao dùng pattern này?
// → Xử lý bất đồng bộ những tác vụ I/O chậm chạp (như Download và Upload) mà không treo HTTP Endpoint.
// → Đảm bảo khả năng Retry tự động và Scale up thêm Node dễ dàng.

@Processor('conversion')
export class ConversionProcessor extends WorkerHost {
  async process(job: Job) { /*...*/ }
}

// Nếu KHÔNG dùng pattern này thì sao?
// → Client gọi API tải nhạc phải chờ hàng chục giây đến phút dẫn tới timeout. Server dễ treo khi có nhiều truy cập song song.
```

### Pattern 2: Stream Uploading
```typescript
// Tại sao dùng pattern này?
// → Chuyển tiếp ngay lập tức dòng dữ liệu (byte) lên cloud qua mạng thay vì đọc toàn bộ bài hát vào bộ nhớ RAM.

const fileStream = fs.createReadStream(outputPath);
await this.storageService.uploadStream(fileStream, 'music', storagePath);

// Nếu KHÔNG dùng pattern này thì sao?
// → fs.readFileSync() một file 50MB thì mất 50MB RAM. Nếu có 100 job cùng lúc thì mất 5GB RAM, gây OOM (Out of Memory) trên server.
```

---

## 8. Biến môi trường cần thiết

```env
REDIS_HOST=           # Địa chỉ host của Redis Server (mặc định localhost)
REDIS_PORT=           # Cổng kết nối Redis (mặc định 6379)
```

---

## 9. Khi AI agent làm việc với module này

**Trước khi thêm feature mới:**
- Mọi logic xử lý liên quan đến background task nặng đều nên đẩy vào Processor thay vì viết vào HTTP Controller.
- Luôn inject logger để track ID của Job, User, Song nhằm phục vụ quá trình debug (Vì job chạy nền không có context Request/Response HTTP).

**Khi sửa logic ConversionProcessor:**
- Đảm bảo lệnh `downloaderService.cleanup()` được thực thi trong TẤT CẢ các kịch bản (Thành công và Thất bại). Điều này BẮT BUỘC để ngăn rò rỉ dung lượng ổ đĩa làm chết server theo thời gian.
- KHÔNG thay đổi cách đọc file qua stream `createReadStream()` thành `readFileSync()`.

**Khi thêm Job Queue mới:**
- Khai báo tên queue tại `jobs.module.ts` qua `BullModule.registerQueue({ name: 'new-queue' })`.
- Tạo file `.processor.ts` mới và gắn `@Processor('new-queue')`.

**Khi debug:**
- Bắt đầu xem log từ server với keyword `"Job failed"`.
- Do không có request/response để debug, thông tin chứa trong tham số `job.data` và context trong catch block là căn cứ quan trọng nhất. Cần kết nối tới Redis để xem cấu trúc và trạng thái cụ thể của Job nếu cần.
