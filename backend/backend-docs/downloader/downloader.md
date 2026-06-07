# Downloader Module Documentation

## 1. Tổng quan Kiến trúc (Component Overview)
Module `Downloader` chịu trách nhiệm tải nhạc (cụ thể là trích xuất âm thanh) từ các nguồn bên ngoài (chủ yếu là YouTube) thông qua công cụ dòng lệnh `yt-dlp`. Module này cung cấp dịch vụ `DownloaderService` để tải file âm thanh chất lượng cao (320kbps MP3) và dọn dẹp file tạm sau khi sử dụng. 

## 2. Các Dependencies (Dependencies Injection)
- **`PinoLogger` (nestjs-pino)**: Được inject qua `@InjectPinoLogger(DownloaderService.name)` để ghi log có cấu trúc các sự kiện: bắt đầu tải, tải hoàn tất, lỗi, và việc dọn dẹp file.
- **`child_process` (Node.js)**: Sử dụng hàm `execFile` (đã được promisify) để thực thi lệnh `yt-dlp` trên hệ điều hành.
- **`fs` (Node.js)**: Module File System của Node.js dùng để kiểm tra sự tồn tại và xóa các file tạm (`existsSync`, `unlinkSync`).
- **`IDownloaderProvider`**: Một interface (`../common/interfaces/downloader-provider.interface`) mà service này tuân thủ, giúp định hình chuẩn giao tiếp (contract) cho việc tải file.

## 3. Phân tích chi tiết Controller, Service, Guard, v.v.
### 3.1. DownloaderModule (`downloader.module.ts`)
- Khai báo `@Module()`: Cung cấp (`providers`) và xuất (`exports`) `DownloaderService` để các module khác có thể import và sử dụng. Không có Controller nào trong module này.

### 3.2. DownloaderService (`downloader.service.ts`)
Các Decorators:
- `@Injectable()`: Đánh dấu class là một provider có thể được inject vào các thành phần khác.
- `@InjectPinoLogger()`: Inject logger với context cụ thể là `DownloaderService`.

**Các Properties:**
- `private readonly audioBitrate = '320K'`: Định nghĩa chất lượng âm thanh mong muốn khi tải bằng `yt-dlp`.

**Các Public Methods:**
- **`download(url: string, outputPath: string): Promise<void>`**:
  - Tham số: `url` (đường dẫn video cần tải), `outputPath` (đường dẫn lưu file trên ổ cứng).
  - Logic: 
    - Ghi log thông báo bắt đầu tải.
    - Xây dựng mảng arguments (`args`) cho lệnh `yt-dlp`. Cấu hình bao gồm: lấy audio tốt nhất (`-f bestaudio/best`), giả lập web client để tránh lỗi chặn IP (`--extractor-args youtube:player_client=web`), thử lại 3 lần nếu lỗi (`--retries 3`, `--fragment-retries 3`), timeout 30 giây (`--socket-timeout 30`), trích xuất âm thanh định dạng MP3 chất lượng 320K (`-x`, `--audio-format mp3`, `--audio-quality 320K`).
    - Gọi `execFileAsync('yt-dlp', args)` để thực thi lệnh.
    - Xử lý lỗi (Catch block): Dựa vào thông báo lỗi (`stderr`) trả về từ tiến trình:
      - Nếu chứa `Requested format is not available` -> Ném `BadRequestException`.
      - Nếu chứa `Video unavailable` -> Ném `NotFoundException`.
      - Ngược lại -> Ghi log lỗi có giới hạn (`hint: stderr.slice(0, 200)`) để bảo vệ dữ liệu và ném `InternalServerErrorException`.
- **`cleanup(filePath: string): Promise<void>`**:
  - Tham số: `filePath` (Đường dẫn file cần xóa).
  - Logic: Kiểm tra xem file có tồn tại trên ổ cứng bằng `fs.existsSync(filePath)`. Nếu có, thực hiện xóa file đồng bộ bằng `fs.unlinkSync(filePath)`. Bắt lỗi và ghi log nếu việc xóa thất bại (ví dụ: bị khóa bởi process khác).
