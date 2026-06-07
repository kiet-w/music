# Báo cáo Cải thiện Hiệu năng & Bảo mật (Code Review)

Tài liệu này ghi chú lại các vấn đề hiệu năng và bảo mật đã được phát hiện trong quá trình code review và các giải pháp đã được áp dụng.

## 1. Các vấn đề đã được khắc phục

### 1.1. Lỗ hổng Command Injection (RCE)
- **Vị trí:** `backend/src/downloader/downloader.service.ts`
- **Vấn đề:** Tham số `url` đầu vào của người dùng trước đây được nối trực tiếp vào chuỗi lệnh shell `execAsync`. Điều này tạo ra nguy cơ Remote Code Execution (RCE) nếu hacker chèn các ký tự đặc biệt của shell.
- **Giải pháp:** Đã thay thế `execAsync` bằng `execFileAsync` và truyền các tham số dưới dạng mảng (array). Hệ điều hành sẽ xử lý `url` như một tham số thuần túy, loại bỏ hoàn toàn nguy cơ injection.

### 1.2. Nguy cơ cạn kiệt bộ nhớ (OOM) khi Upload file
- **Vị trí:** `backend/src/jobs/conversion.processor.ts` và `backend/src/storage/storage.service.ts`
- **Vấn đề:** Quá trình upload file sau khi tải về từ YouTube sử dụng `fs.readFileSync(filePath)`, tức là tải toàn bộ file nhạc vào RAM trước khi đẩy lên Supabase. Việc này có thể làm server quá tải bộ nhớ và crash nếu file lớn hoặc có nhiều tiến trình chạy song song.
- **Giải pháp:** Đã chuyển đổi sang cơ chế Stream. Sử dụng `fs.createReadStream` kết hợp với phương thức `uploadStream` của Storage Service để đẩy trực tiếp luồng dữ liệu lên Supabase mà không cần đệm toàn bộ file vào RAM.

### 1.3. Thiếu giới hạn kích thước Input
- **Vị trí:** `backend/src/songs/dto/create-song-youtube.dto.ts`
- **Vấn đề:** DTO chỉ kiểm tra định dạng URL và chuỗi, nhưng không giới hạn độ dài của `title` và `artist`.
- **Giải pháp:** Bổ sung decorators `@MaxLength(500)` cho URL và `@MaxLength(100)` cho các trường văn bản nhằm bảo vệ database khỏi các payload quá lớn.

### 1.4. Chặn luồng chính (Blocking Event Loop) do đọc file đồng bộ
- **Vị trí:** `backend/src/storage/storage.service.ts`
- **Vấn đề:** Hàm upload dùng `fs.readFileSync` và `fs.existsSync` (các hàm đồng bộ). Trong Node.js (vốn chạy đơn luồng - single threaded), việc đọc I/O đồng bộ sẽ khóa chặt Event Loop. Kết quả là trong lúc chờ ổ cứng đọc xong file, toàn bộ các request của người dùng khác sẽ bị kẹt/treo.
- **Giải pháp:** Thay thế toàn bộ bằng phiên bản bất đồng bộ `fs.promises.readFile` và `fs.promises.access`, trả lại khả năng xử lý song song cho Event Loop.

### 1.5. Lạm dụng Generic Exceptions (Che giấu lỗi gốc)
- **Vị trí:** `GoogleDriveController` và `DownloaderService`
- **Vấn đề:** Các khối `try/catch` bắt mọi lỗi (kể cả lỗi hết hạn token của Google) và ném ra một lỗi chung chung là `500 InternalServerErrorException`. Điều này che giấu nguyên nhân gốc, khiến Frontend không thể xử lý lỗi thông minh (ví dụ: đáng lẽ lỗi `401` thì phải redirect ra trang login, đằng này lại nhận `500`).
- **Giải pháp:** 
  - Tại `DownloaderService`: Tách bạch rõ lỗi `400 BadRequest` (Format không hỗ trợ) và `404 NotFound` (Video bị ẩn/không tồn tại).
  - Tại `GoogleDriveController`: Gỡ bỏ khối `try/catch` bọc quanh hàm `listFiles` để các `UnauthorizedException` được truyền thẳng qua bộ lọc.

### 1.6. Lỗi Database Prisma lọt qua Global Filter
- **Vị trí:** `backend/src/common/filters/all-exceptions.filter.ts`
- **Vấn đề:** Các lỗi cấp thấp của Prisma (như `P2002` trùng lặp dữ liệu) nếu ném trực tiếp ra ngoài sẽ lọt khỏi sự kiểm soát của NestJS và trở thành lỗi `500`.
- **Giải pháp:** Cập nhật `AllExceptionsFilter` để nhận diện cấu trúc lỗi `PrismaClientKnownRequestError` và map chúng thành các mã HTTP chuẩn mực (P2002 -> 409 Conflict, P2025 -> 404 Not Found).

### 1.7. Nghẽn bộ nhớ (RAM) do thiếu Phân trang (Pagination)
- **Vị trí:** `SongService`, `AlbumService`, `AuthService`
- **Vấn đề:** Các hàm `findAll` query toàn bộ dữ liệu từ DB đẩy vào RAM rồi ném qua mạng (`findMany` không giới hạn). Nếu một user có hàng ngàn bài hát, server sẽ sập vì Out of Memory (OOM) và băng thông mạng sẽ bị tắc nghẽn.
- **Giải pháp:** Áp dụng thuật toán Pagination dạng **Limit / Offset** (`skip` và `take` trong Prisma). Trả về chuẩn cấu trúc `{ data, total, page, limit, totalPages }`. Cập nhật lại toàn bộ `useAlbumStore`, `usePlayerStore` (frontend `api.ts`) để bóc tách luồng dữ liệu mới mà không làm vỡ giao diện. Bổ sung hàm `count()` vào `BaseRepository` để lấy tổng record.

### 1.8. Truy vấn thừa vào DB (Thiếu Caching)
- **Vị trí:** `GoogleDriveController.getStatus`
- **Vấn đề:** Client thường xuyên polling (gọi API liên tục) API này để xem user đã link Google Drive chưa. Mỗi lần gọi là một lần thọc sâu vào Database (User Table), gây lãng phí tài nguyên khủng khiếp trong khi trạng thái link Drive cực kỳ hiếm khi thay đổi.
- **Giải pháp:** Cài đặt `@nestjs/cache-manager`. Gắn Cache bộ nhớ đệm (In-memory Cache) ngay tại endpoint này với TTL (thời gian sống) là 5 phút.

---

## 2. Các vấn đề Kiến trúc chờ xem xét

Bên cạnh các lỗi đã vá, một số vấn đề kiến trúc liên quan đến bảo mật và tính nhất quán đang được xem xét để cấu trúc lại:

1. **Lỗ hổng XSS lộ Token qua LocalStorage:** Trạng thái đăng nhập ở frontend hiện đang lưu vào `localStorage`. Cân nhắc chuyển sang sử dụng `HttpOnly cookies` kết hợp cấu hình CORS nghiêm ngặt.
2. **Lưu trữ OAuth Token (Google Drive):** Các token `googleAccessToken` và `googleRefreshToken` đang lưu dưới dạng plain-text trong database. Đề xuất thêm một layer `EncryptionService` để mã hóa (encrypt) dữ liệu này tại rest.
3. **Bất nhất tên gọi Track vs Song:** Định nghĩa Prisma schema là `Track` nhưng các service/repository sử dụng tên `Song`. Cân nhắc chạy migration để chuẩn hóa thuật ngữ trên toàn dự án.
