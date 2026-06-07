---

# Downloader Module — AI Coding Skill Context

> File này dùng làm context cho AI coding agent khi làm việc với Downloader Module.

---

## 1. Kiến trúc tổng thể — Tại sao tổ chức như vậy?

```
Service Caller (Ví dụ: TrackService)
    │
    ▼
DownloaderService       ← Đóng gói toàn bộ logic tương tác với yt-dlp
    │
    ▼
[OS Child Process]      ← Thực thi tiến trình yt-dlp
    │
    ▼
[File System]           ← Lưu file mp3 và dọn dẹp sau khi xong
```

**Tại sao tách các layer?**
- **Đóng gói công cụ ngoại vi (External Tool Wrapping):** Thay vì để logic `exec()` rải rác khắp nơi, `DownloaderService` đóng gói mọi chi tiết về cách cấu hình, các tham số dòng lệnh dài dòng của `yt-dlp` và cách phân loại lỗi vào một nơi duy nhất.
- **Tuân thủ Interface Segregation:** Việc `DownloaderService` implements `IDownloaderProvider` giúp hệ thống không bị trói buộc chặt vào `yt-dlp`. Trong tương lai, nếu muốn đổi sang một thư viện tải nhạc khác, chỉ cần tạo service mới implement interface này mà không cần sửa code ở các module gọi nó.

---

## 2. Các Dependencies

| Dependency | Vai trò |
|------------|---------|
| `child_process` (execFileAsync) | Thực thi công cụ dòng lệnh `yt-dlp` trên hệ điều hành với tư cách là một tiến trình con. |
| `fs` (Node.js) | Giao tiếp với File System để kiểm tra và xóa file nhạc tạm thời sau khi xử lý xong. |
| `PinoLogger` | Ghi log chuẩn cấu trúc (structured logging) theo vết các hoạt động tải và dọn dẹp file, đặc biệt xử lý log lỗi tinh gọn. |

---

## 3. Entry Points — Đi đâu về đâu

<!-- Copy block này cho mỗi phương thức service do không có controller -->

### Service.download(url, outputPath)

```
Caller gọi: { url, outputPath }
    │
    ▼ DownloaderService.download(url, outputPath)
    │   1. Ghi log bắt đầu tải (logger.info).
    │   2. Build arguments cho yt-dlp (định dạng mp3, 320kbps, web client).
    │   3. execFileAsync('yt-dlp', args) → Chạy tiến trình tải.
    │   4. Ghi log hoàn thành.
    │
    ▼ Trả về: void (khi file đã nằm trên ổ cứng ở outputPath)

Lỗi có thể xảy ra:
- [400] BadRequestException → Khi yt-dlp báo không hỗ trợ format cho video này.
- [404] NotFoundException → Khi video bị private hoặc không tồn tại.
- [500] InternalServerErrorException → Khi yt-dlp gặp lỗi bất thường (mạng, chặn IP).
```

### Service.cleanup(filePath)

```
Caller gọi: { filePath }
    │
    ▼ DownloaderService.cleanup(filePath)
    │   1. fs.existsSync(filePath) → Kiểm tra file có tồn tại không.
    │   2. Nếu có, fs.unlinkSync(filePath) → Xóa file.
    │   3. Ghi log hoàn tất xóa hoặc lỗi.
    │
    ▼ Trả về: void
```

---

## 4. Đánh giá — Đã tốt chưa?

### ✅ Đã làm tốt

| Điểm tốt | Lý do |
|----------|-------|
| Phân loại lỗi `yt-dlp` | Code không ném lỗi chung chung mà đã bóc tách `stderr` của lệnh `yt-dlp` để phân loại lỗi như `Format unavailable` (400) hoặc `Video unavailable` (404), giúp client nhận đúng mã lỗi HTTP hợp lý. |
| Bảo vệ quyền riêng tư log | Khi gặp lỗi `InternalServerErrorException`, service giới hạn độ dài của log lỗi (cắt bớt 200 ký tự) thay vì in toàn bộ `stderr` có thể chứa thông tin môi trường nhạy cảm. |
| Xử lý chặn IP từ YouTube | Việc dùng `--extractor-args youtube:player_client=web` là cách thực hành tốt để né các lỗi "sign in to confirm you're not a bot" của YouTube đang gây khó dễ cho `yt-dlp`. |

### ❌ Chưa tốt / Cần cải thiện

**1. Sử dụng API đồng bộ (sync) của File System**
```typescript
// HIỆN TẠI — vấn đề:
// Sử dụng fs.existsSync và fs.unlinkSync trong hàm async sẽ chặn (block) event loop của Node.js.
if (fs.existsSync(filePath)) {
  fs.unlinkSync(filePath);
}

// NÊN SỬA — lý do:
// Nên sử dụng API async/promise của fs để không làm ảnh hưởng tới hiệu năng hệ thống khi tải/xóa nhiều file.
import * as fs from 'fs/promises';
// ...
try {
  await fs.unlink(filePath);
} catch (error) {
  if (error.code !== 'ENOENT') {
    // log lỗi
  }
}
```

**2. Quản lý timeout chưa triệt để ở Node.js level**
```typescript
// HIỆN TẠI:
// Timeout chỉ được set cho `yt-dlp` qua `--socket-timeout 30`. 
// Tuy nhiên nếu `yt-dlp` bị treo (zombie process), promise execFileAsync có thể không bao giờ resolve.
await execFileAsync('yt-dlp', args);

// NÊN SỬA:
// Truyền thêm options `timeout` vào hàm execFileAsync để Node.js tự động kill process nếu chạy quá lâu.
await execFileAsync('yt-dlp', args, { timeout: 60000 }); // 60s timeout
```

---

## 5. API Design Review

Không có HTTP Controller trong module này, do đó không có thông tin đánh giá RESTful API. Mọi tương tác được thực hiện thông qua các service layer gọi xuống.

---

## 6. Cách Debug khi gặp lỗi

### Lỗi 500 InternalServerErrorException (yt-dlp failed)

```
Checklist:
1. Máy chủ (Server/Docker container) đã cài đặt thư viện dòng lệnh `yt-dlp` chưa? (Dùng lệnh `rtk which yt-dlp` để kiểm tra).
2. Phiên bản `yt-dlp` có quá cũ và bị YouTube chặn không? (Thường xuyên phải cập nhật: `yt-dlp -U`).
3. Ổ cứng server có bị đầy không? (Lệnh `df -h`).

Command debug:
→ Kiểm tra log bằng câu lệnh tìm lỗi: grep -r '\[Downloader\] Unexpected error' /var/log/
→ Có thể thử copy trực tiếp command log trong service và chạy trên terminal máy chủ để xem nguyên nhân chi tiết.
```

---

## 7. Các Pattern quan trọng trong module này

### Pattern 1: Wrapper / Adapter Pattern
```typescript
// Tại sao dùng pattern này?
// → Tạo một abstraction layer quanh công cụ dòng lệnh yt-dlp.
// → Cô lập toàn bộ các logic về arguments, parsing stderr vào một chỗ.

export class DownloaderService implements IDownloaderProvider {
   // ...
}

// Nếu KHÔNG dùng pattern này thì sao?
// → Các service khác (như bài hát, album) muốn tải nhạc sẽ phải tự gọi thư viện `exec` và tự xử lý các arguments của yt-dlp, dẫn đến rác code và khó thay đổi sau này.
```

---

## 8. Biến môi trường cần thiết

```env
# Module này hiện tại không sử dụng trực tiếp biến môi trường nào từ ConfigService. 
# Tuy nhiên, nó yêu cầu phải cài đặt `yt-dlp` trên môi trường hệ điều hành host.
```

---

## 9. Khi AI agent làm việc với module này

**Trước khi thêm feature mới:**
- Bất cứ tùy chọn dòng lệnh nào mới cho `yt-dlp` cần được kiểm tra kỹ vì nó có thể thay đổi kết quả đầu ra (chậm hơn, file lớn hơn, bị lỗi với nguồn khác).
- Phải cập nhật test case trong `downloader.service.spec.ts` mỗi khi thay đổi tham số `--audio-quality`, `--audio-format`, v.v.

**Khi sửa phần nhạy cảm của module:**
- KHÔNG thay đổi cách bắt lỗi qua `stderr.includes(...)` nếu không chắc chắn về định dạng output của `yt-dlp`.

**Khi debug:**
- Bắt đầu debug bằng cách chạy thủ công lệnh `yt-dlp` truyền thống ở bên ngoài (terminal server) để chắc chắn rằng mạng/IP server chưa bị YouTube đưa vào blacklist.
