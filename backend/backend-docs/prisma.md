# Module: prisma (Micro-Technical Detail)

Module `prisma` chịu trách nhiệm khởi tạo và quản lý kết nối cơ sở dữ liệu thông qua Prisma ORM.

---

## 1. Thành phần chính
- **Service**: `src/prisma/prisma.service.ts`
- **Module**: `src/prisma/prisma.module.ts`

---

## 2. Chi tiết Module (`PrismaModule`)

- **Impact**: Cung cấp `PrismaService` ra toàn bộ ứng dụng mà không cần phải import lại nhiều lần.
- **Micro-Logic**:
    - Sử dụng decorator `@Global()` của NestJS. Nhờ decorator này, khi `PrismaModule` được import một lần vào root module (`AppModule`), `PrismaService` sẽ tự động có sẵn ở tất cả các module khác (như `albums`, `songs`, `admin`) mà không cần khai báo lại ở mảng `imports`.

---

## 3. Chi tiết Service (`PrismaService`)

Kế thừa trực tiếp từ class `PrismaClient` được generate tự động bởi Prisma, đồng thời implements interface `OnModuleInit` của NestJS.

### `onModuleInit` (Lifecycle Hook)
- **Impact**: Đảm bảo kết nối tới cơ sở dữ liệu được thiết lập ngay khi ứng dụng NestJS khởi động xong phần khởi tạo module.
- **Micro-Logic**:
    - `` `await this.$connect();` `` — Hàm do `PrismaClient` cung cấp để chủ động mở kết nối. Mặc dù Prisma cho phép lazy connect (kết nối khi có query đầu tiên), việc kết nối sẵn lúc khởi động giúp ứng dụng báo lỗi DB ngay lập tức (fail-fast) nếu cấu hình sai hoặc DB chết, tránh lỗi phát sinh lúc runtime khi có request tới.
