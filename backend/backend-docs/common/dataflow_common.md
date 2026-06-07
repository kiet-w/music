## 4. System Data Flow

**1. Luồng xử lý lỗi bằng `AllExceptionsFilter`**
- Flow: Component bất kỳ ném ra Exception -> NestJS kích hoạt `AllExceptionsFilter.catch()` -> Xác định loại Exception (HttpException hoặc PrismaError) -> Dịch mã lỗi Prisma (nếu có) -> Tạo response payload chuẩn -> Ghi log (Pino logger) -> `httpAdapter.reply()` -> Client nhận HTTP Error Response.

**2. Luồng truy cập Database qua `BaseRepository`**
- Flow: Service gọi `Repository.findUnique()` (hoặc hàm tương tự kế thừa từ BaseRepository) -> `BaseRepository` bọc query Prisma trong try/catch -> Gửi truy vấn DB -> DB trả kết quả (thành công) -> Trả về kết quả cho Service. NẾU lỗi (ví dụ trùng lặp khoá P2002) -> catch -> `handlePrismaError()` -> Ném `ConflictException` -> Filter bắt lỗi trả về Client.

**3. Luồng Request Logging với `LoggingInterceptor`**
- Flow: Client Request -> `LoggingInterceptor.intercept()` -> Bắt đầu tính giờ -> Chuyển Request tới Route Handler (`next.handle()`) -> Logic hoàn tất / sinh lỗi -> `tap()` bắt sự kiện hoàn thành/lỗi -> Tính toán `duration` -> Ghi log qua `PinoLogger` -> Response trả về Client.
