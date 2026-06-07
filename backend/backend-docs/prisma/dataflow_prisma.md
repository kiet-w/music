## 4. System Data Flow
Vì đây là Prisma Module chịu trách nhiệm kết nối DB, data flow liên quan đến vòng đời khởi tạo ứng dụng:

**1. Khởi tạo Prisma Service (Ứng dụng Start)**
- Flow: NestJS Application Start -> Khởi tạo `PrismaModule` (Global) -> Khởi tạo `PrismaService` -> Inject `PinoLogger` -> Gọi hook `onModuleInit()` -> `logger.info("Connecting...")` -> Gọi `PrismaClient.$connect()` -> Giao tiếp với Database (PostgreSQL/MySQL/...) -> Kết quả kết nối:
  - Nếu thành công: `logger.info("Successfully connected")` -> Khởi tạo xong.
  - Nếu thất bại: `logger.error("Failed to connect")` -> Ném Exception -> Ứng dụng dừng khởi động.

**(Các module khác khi gọi database query)**
- Flow: Module/Service (Ví dụ: `UserService`) -> Inject `PrismaService` -> Gọi các method như `this.prisma.user.findMany()` -> `PrismaService` (kế thừa `PrismaClient`) đẩy câu truy vấn tới Database -> Trả về kết quả cho Service gọi.
