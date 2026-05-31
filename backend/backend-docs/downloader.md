# Module: downloader (Micro-Technical Detail)

Module `downloader` đóng vai trò cốt lõi trong việc cung cấp công cụ tải file âm thanh (đặc biệt là từ các nền tảng video/âm nhạc). Nó tuân thủ interface `IDownloaderProvider` đã được định nghĩa trong `common`.

---

## 1. Thành phần chính
- **Service**: `src/downloader/downloader.service.ts`
- **Module**: `src/downloader/downloader.module.ts`

*(Module này chỉ có Service, không có Controller do chức năng của nó được gọi nội bộ từ các module/job khác).*

---

## 2. Chi tiết Service (`DownloaderService`)

`DownloaderService` implements interface `IDownloaderProvider`. Đặc điểm nổi bật nhất là việc sử dụng trực tiếp công cụ CLI `yt-dlp` của hệ điều hành thông qua lệnh `exec`.

### `download` (Public)
- **Impact**: Tải file âm thanh từ một URL bất kỳ (thường là YouTube) và lưu trực tiếp dưới dạng `.mp3` tại server.
- **In/Out**:
    - **In**: `url` (đường dẫn web), `outputPath` (đường dẫn file vật lý trên ổ cứng server sẽ lưu).
    - **Out**: `Promise<void>`. Báo lỗi `InternalServerErrorException` nếu thất bại.
- **Micro-Logic**:
    - Sử dụng `promisify(exec)` để chuyển callback-based của hàm `exec` (Node.js child_process) sang Promise/async-await.
    - Lệnh thực thi: `` `yt-dlp -x --audio-format mp3 -o "${outputPath}" "${url}"` ``
        - `-x`: Yêu cầu `yt-dlp` chỉ trích xuất audio (extract audio), bỏ qua video.
        - `--audio-format mp3`: Ép định dạng đầu ra thành `.mp3`.
        - `-o "${outputPath}"`: Định định vị trí lưu file (thường là folder tạm `/tmp/`).
    - **Xử lý lỗi**:
        - `` `catch (error) { throw new InternalServerErrorException(...) }` `` — Nếu `exec` quăng lỗi (do URL sai, yt-dlp lỗi mạng...), catch lại, log ra và throw lỗi HTTP 500 (nếu luồng này được trigger trực tiếp từ 1 API Request).

### `cleanup` (Public)
- **Impact**: Xóa file vật lý đã được tải về để dọn dẹp dung lượng disk (được gọi sau khi file đã upload xong lên Cloud Storage).
- **In/Out**:
    - **In**: `filePath` (đường dẫn file cần xóa).
    - **Out**: `Promise<void>`.
- **Micro-Logic**:
    - `` `if (fs.existsSync(filePath))` `` — Kiểm tra file có tồn tại không trước khi xóa, tránh throw lỗi unhandled.
    - `` `fs.unlinkSync(filePath)` `` — Dùng method đồng bộ để xóa ngay lập tức (do xóa file thường rất nhanh).
    - Catch tất cả lỗi và chỉ ghi log, không ném (throw) lỗi ra ngoài (do đây là tiến trình dọn dẹp, nếu lỗi cũng không nên ảnh hưởng luồng chính của user).
