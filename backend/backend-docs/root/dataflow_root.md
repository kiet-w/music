## 4. System Data Flow
**1. Quá trình khởi động ứng dụng (Application Bootstrap)**
- Flow: `main.ts` khởi chạy `bootstrap()` -> Gọi thư viện `dotenv` để nạp `.env` -> Gọi `NestFactory.create(AppModule)` -> Khởi tạo DI Container và khởi tạo các global module (`ConfigModule`, `LoggerModule`, `CacheModule`) -> Khởi tạo tất cả các Sub-Modules -> Set custom pino logger -> Gắn CORS middleware -> Gắn Global `AllExceptionsFilter` -> Gắn Global `ValidationPipe` -> Khởi tạo Swagger -> `app.listen()` -> Server sẵn sàng nhận Request.

**2. Luồng Request Cơ bản (khi đi qua Root config)**
- Flow: Client Request -> NestJS Server -> CORS Middleware (kiểm tra header) -> Global `LoggingInterceptor` (Ghi nhận request bắt đầu) -> Global `ValidationPipe` (nếu là request có body tới Controller, tự động validate DTO) -> Controller (của Sub-Module) -> Service (của Sub-Module) -> Trả về kết quả -> Global `LoggingInterceptor` (Ghi nhận thời gian và status trả về) -> Trả về Client.
*(Nếu trong quá trình có lỗi xảy ra: Bất cứ nơi nào throw Exception -> `AllExceptionsFilter` bắt được -> Xử lý định dạng lỗi & Ghi log qua Pino -> Trả về HTTP Error Response cho Client).*
