# Jobs Module Documentation

## 1. Tổng quan Kiến trúc (Component Overview)
Module `Jobs` chịu trách nhiệm thiết lập và quản lý các background jobs (hàng đợi công việc) trong hệ thống sử dụng BullMQ và Redis. Cụ thể, module này đang xử lý hàng đợi `conversion`, đảm nhiệm việc tải bài hát từ YouTube, tải lên hệ thống lưu trữ (Supabase Storage) và cập nhật đường dẫn vào cơ sở dữ liệu. Kiến trúc này giúp hệ thống xử lý các tác vụ nặng một cách bất đồng bộ mà không block main thread (luồng chính) của ứng dụng.

## 2. Các Dependencies (Dependencies Injection)
- **`BullModule`**: Được sử dụng để kết nối với Redis server và đăng ký/cấu hình hàng đợi `conversion` trong hệ thống thông qua `@nestjs/bullmq`.
- **`DownloaderModule` / `DownloaderService`**: Cung cấp service hỗ trợ tải file audio từ YouTube và dọn dẹp file tạm.
- **`StorageModule` / `StorageService`**: Cung cấp service để stream dữ liệu lên cloud storage (Supabase) và lấy public URL sau khi upload.
- **`PrismaModule` (thông qua `PrismaService`)**: Giao tiếp với cơ sở dữ liệu (PostgreSQL) để cập nhật thông tin bài hát.
- **`PinoLogger` (nestjs-pino)**: Dùng để ghi lại log trong quá trình xử lý background job, đặc biệt là log lỗi khi job thất bại.

## 3. Phân tích chi tiết Module & Processor
### 3.1. JobsModule (`jobs.module.ts`)
Các Decorators:
- `@Module`: Định nghĩa đây là một module của NestJS.
Các thuộc tính cấu hình:
- **`imports`**: 
  - `BullModule.forRoot(...)`: Khởi tạo cấu hình kết nối BullMQ chung toàn hệ thống, đọc cấu hình kết nối Redis từ biến môi trường `REDIS_HOST` và `REDIS_PORT`.
  - `BullModule.registerQueue({ name: 'conversion' })`: Đăng ký một queue cụ thể tên là `conversion` để hệ thống có thể enqueue (đẩy job) và worker (processor) có thể xử lý.
  - `DownloaderModule`, `StorageModule`: Import các module liên quan để các service tương ứng có thể được inject vào các provider của `JobsModule`.
- **`providers`**: `ConversionProcessor` - đăng ký background worker xử lý job cho queue.
- **`exports`**: `BullModule` - export `BullModule` ra ngoài, cho phép các module khác (như Controller/Service thêm job) có thể inject queue này.

### 3.2. ConversionProcessor (`conversion.processor.ts`)
Các Decorators:
- `@Processor('conversion')`: Gắn cờ class này là một worker/processor của BullMQ, chịu trách nhiệm xử lý các jobs được đẩy vào hàng đợi có tên là `conversion`.
Class này kế thừa `WorkerHost` từ gói `@nestjs/bullmq`.

#### Các Dependencies được Inject:
- `logger: PinoLogger`: Cung cấp khả năng ghi log cấu trúc. Decorator `@InjectPinoLogger(ConversionProcessor.name)` dùng để gắn context log là `ConversionProcessor`.
- `downloaderService: DownloaderService`: Xử lý logic tải file.
- `storageService: StorageService`: Xử lý upload stream file lên Storage.
- `prisma: PrismaService`: Tương tác với Database.

#### Các Public Methods:
- **`process(job: Job<any, any, string>): Promise<any>`**: 
  - **Tham số**: Đối tượng `job` chứa dữ liệu của tác vụ lấy từ Redis. Payload cụ thể nằm trong `job.data` chứa: `url` (link YouTube), `songId` (ID bài hát), `userId` (ID người dùng).
  - **Logic thực thi**:
    1. Tạo thư mục tạm `temp` ở root directory (`process.cwd()`) nếu chưa tồn tại.
    2. Xác định đường dẫn file đầu ra `outputPath` (`temp/[songId].mp3`).
    3. **Tải file**: Gọi `downloaderService.download(url, outputPath)` để tải âm thanh từ YouTube lưu vào thư mục tạm.
    4. **Upload stream**: Tạo `ReadStream` từ `outputPath`. Gọi `storageService.uploadStream(fileStream, 'music', storagePath)` để tải trực tiếp luồng dữ liệu lên bucket `music` với đường dẫn `songs/[songId].mp3`. Việc stream giúp tránh lỗi tràn bộ nhớ (Out Of Memory - OOM).
    5. **Lấy Public URL**: Gọi `storageService.getPublicUrl('music', storagePath)`.
    6. **Cập nhật Database**: Gọi `prisma.track.update` để lưu `publicUrl` vào trường `url` của bản ghi bài hát có ID là `songId`.
    7. **Dọn dẹp (Thành công)**: Xóa file tạm tại `outputPath` thông qua `downloaderService.cleanup()`.
    8. **Return**: Trả về một đối tượng chứa `{ storagePath, publicUrl }`. Nếu trả về thành công, BullMQ sẽ đánh dấu job là "completed".
  - **Xử lý ngoại lệ (Catch)**:
    - Nếu có bất cứ lỗi nào xảy ra trong chuỗi bước trên, catch block sẽ được kích hoạt.
    - Gọi `this.logger.error` để ghi lại lỗi chi tiết bao gồm `songId`, `userId`, `error.message`.
    - Dọn dẹp file tạm dù có lỗi bằng cách gọi lại `downloaderService.cleanup(outputPath)`.
    - Ném lại (throw) lỗi (`error`) để BullMQ có thể biết rằng job đã thất bại và đánh dấu là "failed" (hoặc retry lại tùy cấu hình queue).
