# Root Documentation

## 1. Tổng quan Kiến trúc (Component Overview)
Module `Root` đóng vai trò là entry point chính của toàn bộ ứng dụng NestJS. Nó chịu trách nhiệm khởi tạo ứng dụng, thiết lập các middleware, interceptors, filters toàn cục và nạp toàn bộ các sub-modules chức năng của hệ thống (như Auth, Songs, Albums, v.v.). Nó cũng quản lý cấu hình các module dùng chung (global modules) như `ConfigModule` để đọc biến môi trường, `LoggerModule` (nestjs-pino) để ghi log, và `CacheModule` để caching.

## 2. Các Dependencies (Dependencies Injection)
- **`ConfigModule`**: Nạp và quản lý các biến môi trường (từ `.env`), được cấu hình là module global (`isGlobal: true`) để mọi module khác đều có thể sử dụng `ConfigService` mà không cần import lại.
- **`LoggerModule` (nestjs-pino)**: Cung cấp hệ thống logging toàn cục, ghi đè logger mặc định của NestJS. Phân biệt log level theo môi trường (production/development) và tích hợp transport `pino-pretty` ở môi trường dev.
- **`CacheModule`**: Khởi tạo in-memory cache dùng chung toàn cục (`isGlobal: true`) với thời gian sống (TTL) mặc định là 60 giây.
- **Các Sub-Modules**: `DownloaderModule`, `StorageModule`, `JobsModule`, `PrismaModule`, `SongsModule`, `AlbumsModule`, `GoogleDriveModule`, `AdminModule`, `AuthModule`, `MessagesModule`. Đóng vai trò cấu trúc các domain nghiệp vụ con.

## 3. Phân tích chi tiết Controller, Service, Guard, v.v.
### 3.1. Entry point: `main.ts`
- **`bootstrap()` (Function)**: Hàm chính khởi chạy server.
  - Gọi `config({ override: true })` từ `dotenv` ở đầu file để đảm bảo biến môi trường từ `.env` được ưu tiên.
  - Sử dụng `NestFactory.create` với option `{ bufferLogs: true }` để đảm bảo log ban đầu được giữ lại cho đến khi custom logger được khởi tạo.
  - Cấu hình custom logger: Lấy `Logger` của pino từ DI container và gọi `app.useLogger(logger)`.
  - Cấu hình CORS với `app.enableCors(...)`, cho phép tất cả các nguồn gốc, credentials `true`, và các HTTP methods cơ bản.
  - Thiết lập Global Filter: Cài đặt `AllExceptionsFilter` (kế thừa `BaseExceptionFilter`) để bắt và xử lý mọi exception toàn cục, sử dụng `HttpAdapterHost` và pino logger.
  - Thiết lập Global Pipe: Sử dụng `ValidationPipe` toàn cục với các options: `whitelist: true` (lọc bỏ các field không có trong DTO), `forbidNonWhitelisted: true` (báo lỗi nếu có field lạ), `transform: true` (tự động chuyển đổi kiểu dữ liệu payload sang DTO object).
  - Cấu hình Swagger: Sử dụng `DocumentBuilder` để khởi tạo mô tả API và `SwaggerModule.setup` để phục vụ tài liệu Swagger tại đường dẫn `/api`.
  - Mở cổng HTTP: Khởi động server tại cổng `process.env.PORT` (mặc định 3000), sau đó ghi log khi server chạy thành công.

### 3.2. AppModule (`app.module.ts`)
Các Decorators:
- `@Module()`: Khai báo lớp `AppModule` là một NestJS module.

**Các thành phần (Properties):**
- **`imports`**: Khai báo danh sách các module được nạp. Chứa cả thư viện bên ngoài (ConfigModule, LoggerModule, CacheModule) và các module nghiệp vụ nội bộ.
- **`controllers`**: Đăng ký `AppController` (một controller kiểm tra health check đơn giản của core).
- **`providers`**: 
  - Khai báo `AppService`.
  - Đăng ký một Global Interceptor: Cung cấp `LoggingInterceptor` sử dụng token `APP_INTERCEPTOR`. Điều này có nghĩa mọi HTTP request/response sẽ tự động đi qua `LoggingInterceptor` trước/sau khi tới controller.

### 3.3. Root Configurations (Các file cấu hình gốc)
- **`package.json`**: Chứa thông định project, scripts chạy (build, start, lint, test) và danh sách dependencies. Dự án sử dụng `@nestjs/core`, `@prisma/client`, `bullmq` (cho hàng đợi), `nestjs-pino`, `supabase-js`, `googleapis`.
- **`.env`**: Lưu trữ biến môi trường bảo mật: `DATABASE_URL` (kết nối Supabase Postgres qua pooler), `DIRECT_URL`, cổng chạy `PORT=3002`, thông tin OAuth của Google, `JWT_SECRET` cho việc tạo và giải mã token.
- **`nest-cli.json`**: Cấu hình CLI cho NestJS, xác định thư mục `src` và cài đặt dọn dẹp thư mục build trước khi biên dịch `deleteOutDir: true`.
- **`tsconfig.json`**: Thiết lập cấu hình TypeScript compiler (ví dụ: tắt `strictNullChecks`, bật `experimentalDecorators`).
