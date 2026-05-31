# Module: jobs (Micro-Technical Detail)

Module `jobs` quản lý các tác vụ chạy ngầm (background jobs) sử dụng Redis và BullMQ. Điển hình nhất là tiến trình tải nhạc từ xa, xử lý và upload lên storage mà không chặn (block) request của người dùng.

---

## 1. Thành phần chính
- **Processor**: `src/jobs/conversion.processor.ts`
- **Module**: `src/jobs/jobs.module.ts`

*(Module này không có Controller, chỉ đóng vai trò là một Worker/Consumer cho message queue).*

---

## 2. Chi tiết Module Configuration (`JobsModule`)

- **Impact**: Cấu hình kết nối Redis và khởi tạo hàng đợi (queue).
- **Micro-Logic**:
    - Dùng `BullModule.forRoot()` để thiết lập connection tới Redis (thông qua `REDIS_HOST`, `REDIS_PORT`).
    - Dùng `BullModule.registerQueue({ name: 'conversion' })` để đăng ký một queue tên là `conversion` cho hệ thống. Bất kỳ module nào khác (ví dụ: `songs`) cũng có thể import `JobsModule` (hoặc BullModule) để đẩy (produce) job vào queue này.
    - Import `DownloaderModule`, `StorageModule` để phục vụ logic xử lý bên trong worker.

---

## 3. Chi tiết Processor (`ConversionProcessor`)

Kế thừa `WorkerHost` từ `@nestjs/bullmq` và được đánh dấu bằng `@Processor('conversion')`. Lớp này sẽ tự động lắng nghe và tiêu thụ (consume) các message gửi vào queue `conversion`.

### `process(job: Job<any, any, string>)` (Public/Hook)
- **Impact**: Hàm cốt lõi sẽ chạy khi có một job mới trong queue. Thực hiện một luồng đồng bộ: Tải file -> Upload Storage -> Cập nhật DB -> Dọn rác.
- **In/Out**:
    - **In**: `job.data` chứa `{ url, songId }`.
    - **Out**: Trả về object `{ storagePath, publicUrl }` báo hiệu job thành công, hoặc throw lỗi để BullMQ biết là job thất bại (sẽ tự động retry nếu có cấu hình).
- **Luồng thực thi & Micro-Logic**:
    - **Khởi tạo thư mục tạm**: `` `const tempDir = path.join(process.cwd(), 'temp');` `` Tạo thư mục `temp` nếu chưa có. Khai báo `outputPath` là `<songId>.mp3`.
    - **Bước 1: Download**: `` `await this.downloaderService.download(url, outputPath);` `` Sử dụng CLI `yt-dlp` tải video từ YouTube (hoặc nguồn khác) và xuất ra file MP3 lưu tại thư mục `temp`.
    - **Bước 2: Upload**: `` `await this.storageService.upload(outputPath, 'music', storagePath);` `` Upload file mp3 vật lý vừa tải lên bucket `music` của Supabase (hoặc S3).
    - **Bước 3: Lấy URL public**: `` `const publicUrl = await this.storageService.getPublicUrl(...);` ``
    - **Bước 4: Cập nhật DB**: `` `await this.prisma.track.update({ where: { id: songId }, data: { url: publicUrl } });` `` Cập nhật bản ghi bài hát trong DB, gắn URL public vào để client có thể bắt đầu stream nhạc. (Lưu ý: model ở đây tên là `track` thay vì `song`).
    - **Bước 5: Dọn dẹp**: `` `await this.downloaderService.cleanup(outputPath);` `` Xóa file mp3 trong thư mục `temp` để giải phóng ổ cứng.
- **Xử lý lỗi**:
    - Được bọc trong `try/catch`. Nếu bất kỳ bước nào lỗi (tải lỗi, upload rớt mạng...), nó sẽ log lỗi, *nhưng vẫn cố gắng gọi `cleanup(outputPath)`* để không để lại file rác nếu đã tải xong mà upload lỗi. Sau đó `throw error` để BullMQ xử lý retry/fail.
