## 4. System Data Flow

**1. Queue worker `conversion` (process)**
- Flow: BullMQ Queue (từ Redis) -> `ConversionProcessor` (`process()`)
    -> Trích xuất `url`, `songId`, `userId` từ `job.data`
    -> Hệ thống File (Kiểm tra/Tạo thư mục `temp`)
    -> `DownloaderService` (`download()`) -> YouTube (Tải file) -> Lưu file `temp/[songId].mp3`
    -> Khởi tạo `fs.createReadStream` từ file tạm
    -> `StorageService` (`uploadStream()`) -> Supabase Storage (Upload nhạc)
    -> `StorageService` (`getPublicUrl()`) -> Supabase (Lấy link Public)
    -> `PrismaService` (`track.update()`) -> Database (Cập nhật `publicUrl` vào bài hát)
    -> `DownloaderService` (`cleanup()`) -> Hệ thống File (Xóa file tạm)
    -> Trả về kết quả cho BullMQ (Đánh dấu completed).
- Lỗi (Exception Flow):
    -> Lỗi xảy ra ở bất kỳ bước nào (ví dụ: YouTube block, Storage từ chối, DB mất kết nối) -> Catch block
    -> `logger.error()` -> Ghi log (Pino)
    -> `DownloaderService` (`cleanup()`) -> Hệ thống File (Xóa file tạm nếu đã tạo)
    -> throw error -> BullMQ (Đánh dấu failed).
