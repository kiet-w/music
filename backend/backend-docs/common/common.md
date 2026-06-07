# Common Module Documentation

## 1. Tổng quan Kiến trúc (Component Overview)
Thư mục `Common` không phải là một module tính năng thông thường mà là nơi chứa các thành phần chia sẻ (shared components) được sử dụng xuyên suốt toàn bộ ứng dụng NestJS. Nó bao gồm các Filters (xử lý lỗi tập trung), Interceptors (can thiệp luồng request/response), Interfaces (định nghĩa hợp đồng cho các provider như storage, downloader) và Repositories (lớp truy xuất cơ sở dữ liệu cơ bản).

## 2. Các Dependencies (Dependencies Injection)
- **`HttpAdapterHost`**: Được inject vào `AllExceptionsFilter` để có thể truy xuất HTTP adapter hiện tại (ví dụ Express) nhằm phản hồi request.
- **`PinoLogger` (nestjs-pino)**: Dùng trong `AllExceptionsFilter` và `LoggingInterceptor` để ghi log có cấu trúc về request, response và các lỗi (error/warn).
- **`PrismaService`**: Được inject vào `BaseRepository` để cung cấp Prisma Client phục vụ việc truy vấn database.

## 3. Phân tích chi tiết Controller, Service, Guard, v.v.
### 3.1. Filters
- **`AllExceptionsFilter` (`all-exceptions.filter.ts`)**:
  - Decorator: `@Catch()` (bắt mọi loại exception).
  - Kế thừa: `ExceptionFilter`.
  - Logic: Phương thức `catch()` xác định status code từ exception. Nếu là `HttpException`, trích xuất thông báo lỗi chuẩn. Nếu là lỗi `Error` nói chung và đặc biệt là lỗi của Prisma (`PrismaClientKnownRequestError`), thực hiện map các mã lỗi Prisma sang HTTP Status Code tương ứng (P2002 -> `409 CONFLICT`, P2025 -> `404 NOT_FOUND`). Xây dựng body response theo format chung (statusCode, message, code, timestamp, path). Tùy thuộc vào statusCode (>= 500 hay nhỏ hơn) sẽ gọi `logger.error` hoặc `logger.warn`.
- **`HttpExceptionFilter` (`http-exception.filter.ts`)**:
  - Decorator: `@Catch(HttpException)` (chỉ bắt lỗi HttpException).
  - Kế thừa: `ExceptionFilter`.
  - Logic: Phương thức `catch()` định dạng trực tiếp các HttpException thành JSON payload chuẩn chứa `statusCode`, `message`, `timestamp`, `path`.

### 3.2. Interceptors
- **`LoggingInterceptor` (`logging.interceptor.ts`)**:
  - Decorator: `@Injectable()`.
  - Kế thừa: `NestInterceptor`.
  - Logic: Phương thức `intercept()` lấy thông tin request (method, url, query, body, params). Dùng RxJS `tap` để đo đạc thời gian xử lý (duration). Khi request hoàn tất thành công, ghi log mức `info`. Khi request thất bại, ghi log mức `error` kèm theo stack trace và error message.

### 3.3. Interfaces
- **`IDownloaderProvider` (`downloader-provider.interface.ts`)**: Định nghĩa các hàm `download(url, outputPath)` và `cleanup(filePath)`.
- **`IStorageProvider` (`storage-provider.interface.ts`)**: Định nghĩa các thao tác lưu trữ file như `upload`, `uploadBuffer`, `uploadStream`, `getPublicUrl`, và `delete`.

### 3.4. Repositories
- **`BaseRepository` (`base.repository.ts`)**:
  - Logic: Một abstract class generic (Generic type `T` và `Delegate`) bao bọc các lời gọi tới Prisma (`findMany`, `findUnique`, `count`, `findFirst`, `create`, `update`, `delete`).
  - Helper `handlePrismaError(error)`: Hàm private/protected dịch các mã lỗi Prisma (P2002, P2025, P2003) thành các `HttpException` tương ứng của NestJS (`ConflictException`, `NotFoundException`, `BadRequestException`) để xử lý thống nhất. Tất cả các thao tác query đều được đặt trong khối try/catch và ném lỗi qua `handlePrismaError`.
