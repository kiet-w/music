# Module: common (Micro-Technical Detail)

Module `common` là nơi chứa các thành phần dùng chung cho toàn bộ ứng dụng, bao gồm các lớp trừu tượng (abstract classes), interfaces định nghĩa hợp đồng (contracts) cho các provider bên ngoài, interceptors và exception filters để xử lý các logic cắt ngang (cross-cutting concerns).

---

## 1. Thành phần chính
- **Repositories**: `BaseRepository`
- **Interfaces**: `IStorageProvider`, `IDownloaderProvider`
- **Interceptors**: `LoggingInterceptor`
- **Filters**: `HttpExceptionFilter`

---

## 2. Chi tiết Repositories (`BaseRepository`)

Nằm tại `src/common/repositories/base.repository.ts`.
Đây là một Generic Abstract Class đóng vai trò như một wrapper mỏng cho Prisma Delegate.

### `BaseRepository<T, Delegate>`
- **Impact**: Cung cấp các thao tác CRUD cơ bản cho tất cả các Repository khác kế thừa nó, giảm thiểu boilerplate code.
- **Micro-Logic**:
    - Nhận vào `PrismaService` và `Delegate` (ví dụ `Prisma.AlbumDelegate<any>`) thông qua constructor.
    - Cung cấp các hàm `findMany`, `findUnique`, `create`, `update`, `delete`.
    - Tất cả các hàm này đều đơn giản là ép kiểu `this.delegate as any` và gọi method tương ứng, truyền thẳng `args` vào.
    - `` `return (this.delegate as any).findMany(args);` `` — Ủy quyền toàn bộ việc xử lý query parameter (where, include, select, v.v.) cho Prisma.

---

## 3. Chi tiết Interfaces

Định nghĩa các "Hợp đồng" (Contracts) để thực hiện Dependency Inversion.

### `IStorageProvider` (`storage-provider.interface.ts`)
- **Impact**: Định nghĩa các hàm chuẩn mà một Storage Service (như Supabase, AWS S3) bắt buộc phải implement.
- **Methods**:
    - `upload(filePath, bucketName, destinationPath): Promise<string>` — Upload từ file vật lý trên disk.
    - `uploadBuffer(buffer, bucketName, destinationPath, contentType?): Promise<string>` — Upload từ buffer trong memory.
    - `getPublicUrl(bucketName, path): Promise<string>` — Lấy URL public để access file.
    - `delete(bucketName, path): Promise<void>` — Xóa file.

### `IDownloaderProvider` (`downloader-provider.interface.ts`)
- **Impact**: Định nghĩa hợp đồng cho các dịch vụ tải file từ Internet.
- **Methods**:
    - `download(url, outputPath): Promise<void>` — Tải file từ `url` và lưu tại `outputPath`.
    - `cleanup(filePath): Promise<void>` — Xóa file đã tải để giải phóng dung lượng.

---

## 4. Chi tiết Interceptors (`LoggingInterceptor`)

Nằm tại `src/common/interceptors/logging.interceptor.ts`.

- **Impact**: Ghi log tự động cho tất cả các HTTP Request tới server, đo lường thời gian phản hồi (response time).
- **Micro-Logic**:
    - Sử dụng `Logger('HTTP')` của NestJS.
    - `` `const request = context.switchToHttp().getRequest();` `` — Trích xuất Method và URL từ Express Request.
    - `` `const now = Date.now();` `` — Đánh dấu thời gian bắt đầu.
    - `` `return next.handle().pipe(tap(() => this.logger.log(...)))` `` — Dùng `rxjs` operator `tap` để ghi log ngay sau khi xử lý xong request (hoặc throw lỗi), tính toán khoảng thời gian bằng `Date.now() - now`.

---

## 5. Chi tiết Filters (`HttpExceptionFilter`)

Nằm tại `src/common/filters/http-exception.filter.ts`.

- **Impact**: Bắt toàn bộ các lỗi `HttpException` (và kế thừa của nó) văng ra trong quá trình xử lý, để format lại cục JSON trả về cho người dùng (Client) theo chuẩn chung.
- **Micro-Logic**:
    - Đánh dấu bằng `@Catch(HttpException)`.
    - `` `const exceptionResponse = exception.getResponse();` `` — Lấy payload lỗi mặc định của NestJS.
    - Lấy ra `message` từ bên trong `exceptionResponse` (nếu là dạng Object) hoặc dùng `exception.message` mặc định.
    - **Format lại Response**:
      ```typescript
      response.status(status).json({
        statusCode: status,
        message, // Lấy được thông báo lỗi cụ thể
        timestamp: new Date().toISOString(),
        path: request.url, // Kèm theo path bị lỗi
      });
      ```
