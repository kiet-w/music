# Prisma Module Documentation

## 1. Tổng quan Kiến trúc (Component Overview)
Module `Prisma` chịu trách nhiệm khởi tạo, cấu hình và cung cấp kết nối tới Database thông qua thư viện `PrismaClient` của Prisma ORM. Đây là một Global Module, cung cấp `PrismaService` dùng chung cho toàn bộ ứng dụng mà không cần import lại ở từng module cụ thể. Tính năng chính bao gồm kết nối với DB khi module được khởi tạo và ghi log các hoạt động bằng `nestjs-pino`.

## 2. Các Dependencies (Dependencies Injection)
- **`nestjs-pino`**: Cung cấp `PinoLogger` để ghi log quá trình kết nối đến database (thông qua `@InjectPinoLogger`).
- **`@prisma/client`**: Cung cấp lớp cha `PrismaClient` mà `PrismaService` kế thừa để thực hiện các thao tác với Database.

## 3. Phân tích chi tiết Controller, Service, Guard, v.v.
### 3.1. PrismaModule (`prisma.module.ts`)
Các Decorators:
- `@Global()`: Biến module này thành Global Module, nghĩa là các provider của nó (`PrismaService`) sẽ được khả dụng ở mọi module khác trong ứng dụng NestJS mà không cần import `PrismaModule`.
- `@Module()`: Khai báo module với `providers` và `exports` đều chứa `PrismaService`.

### 3.2. PrismaService (`prisma.service.ts`)
Các Decorators:
- `@Injectable()`: Đánh dấu class là một provider có thể được inject vào các component khác của NestJS.

**Class inheritance**:
- Kế thừa `PrismaClient` từ `@prisma/client`. Nhờ đó, `PrismaService` sở hữu toàn bộ các phương thức truy vấn DB được Prisma tự động generate.
- Implements `OnModuleInit`: Cho phép thực thi một đoạn logic (hook) khi NestJS khởi tạo module.

**Constructor**:
- Inject `PinoLogger` vào với context là `PrismaService.name` (thông qua `@InjectPinoLogger(PrismaService.name)`).
- Gọi `super()` để khởi tạo lớp cha `PrismaClient`.

**Các Public Methods**:
- **`onModuleInit()`**:
  - Tham số: Không có.
  - Logic: Hook này được gọi tự động bởi NestJS khi khởi động ứng dụng. Nó ghi log `'Connecting to Prisma database...'`, sau đó gọi phương thức `$connect()` (của `PrismaClient`) để thiết lập kết nối tới Database. Nếu thành công, ghi log `'Successfully connected to database'`. Nếu có lỗi xảy ra, ghi log lỗi bằng `logger.error` và ném ra ngoại lệ (`throw error`) để dừng ứng dụng.
  - Return: Promise. Trả về khi kết nối hoàn tất hoặc ném lỗi.
