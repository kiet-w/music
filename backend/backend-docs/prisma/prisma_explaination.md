---

# Prisma Module — AI Coding Skill Context

> File này dùng làm context cho AI coding agent khi làm việc với Prisma Module.

---

## 1. Kiến trúc tổng thể — Tại sao tổ chức như vậy?

```
NestJS Application (Khởi động)
    │
    ▼
PrismaModule            ← Global Module, cung cấp PrismaService cho toàn app
    │
    ▼
PrismaService           ← Kế thừa PrismaClient, xử lý lifecycle (kết nối DB) và logging
    │
    ▼
[Database]              ← Kết nối và thực thi query
```

**Tại sao tách các layer?**
- **Đóng gói PrismaClient:** Kế thừa `PrismaClient` thành `PrismaService` chuẩn hóa nó thành một provider của NestJS, cho phép sử dụng dependency injection (DI).
- **Quản lý vòng đời (Lifecycle hooks):** Sử dụng `OnModuleInit` để chủ động gọi `$connect()` và xử lý lỗi kết nối ngay khi khởi động ứng dụng, tránh lỗi xảy ra âm thầm ở request đầu tiên.
- **Tích hợp Logging thống nhất:** Việc nhúng `nestjs-pino` trực tiếp vào `PrismaService` giúp việc ghi log kết nối trở nên đồng bộ với hệ thống log toàn cục của app.
- **Global Module:** Đặt module làm `@Global()` giúp các module khác (như Auth, User, Music, v.v.) không phải lặp lại việc `imports: [PrismaModule]` trong từng file module của chúng.

---

## 2. Các Dependencies

| Dependency | Vai trò |
|------------|---------|
| `@prisma/client` | Thư viện ORM cốt lõi. Cung cấp lớp cha `PrismaClient` thực thi các câu truy vấn cơ sở dữ liệu. |
| `nestjs-pino` | Thư viện logging. Cung cấp `PinoLogger` và `@InjectPinoLogger` để ghi nhận các sự kiện khi kết nối hoặc lỗi với cấu trúc rõ ràng. |

---

## 3. Entry Points — Đi đâu về đâu

Vì đây không phải là một module chứa HTTP Controllers, Entry Point của module này là trong quá trình khởi động ứng dụng (Lifecycle Hook).

### NestJS Lifecycle Hook: onModuleInit

```
NestJS Bootstrap
    │
    ▼ PrismaService.onModuleInit()
    │   1. Ghi log: Bắt đầu kết nối (Connecting to Prisma database...)
    │   2. Gọi this.$connect() của PrismaClient để thực sự mở kết nối tới DB.
    │   3. Nếu thành công: Ghi log thành công.
    │
    ▼ Trả về: Promise<void>

Lỗi có thể xảy ra:
- Error → Kết nối thất bại (sai thông tin cấu hình, DB chưa chạy). Ghi log error và throw lỗi, làm ứng dụng báo lỗi crash ngay khi startup.
```

---

## 4. Đánh giá — Đã tốt chưa?

### ✅ Đã làm tốt

| Điểm tốt | Lý do |
|----------|-------|
| Sử dụng `@Global()` | Tiết kiệm thời gian cấu hình cho các module khác. Prisma thường được dùng khắp nơi trong hệ thống, cấu hình `@Global()` là một practice rất tốt. |
| Tích hợp Logging với Pino | Ghi log đầy đủ trong quá trình khởi tạo (`onModuleInit`) bao gồm cả thành công và thất bại giúp việc debug khi triển khai (deploy) dễ dàng. Việc dùng cấu trúc `{ error: error.message }` chuẩn log JSON. |
| Khởi tạo sớm (Early connection) | Gọi `$connect()` trong `onModuleInit` giúp ứng dụng phát hiện lỗi kết nối DB ngay lập tức thay vì đợi request đầu tiên mới lazy-connect và lỗi. |

### ❌ Chưa tốt / Cần cải thiện

**1. Chưa bắt sự kiện đóng kết nối khi tắt app**
```typescript
// HIỆN TẠI — vấn đề:
// Khi ứng dụng shutdown (VD: nhận SIGTERM), kết nối Prisma không được đóng một cách tường minh (graceful shutdown).

// NÊN SỬA — lý do:
// Implement thêm hook `OnModuleDestroy` để đóng kết nối, giải phóng tài nguyên.
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // ... (giữ nguyên constructor và onModuleInit)

  async onModuleDestroy() {
    this.logger.info('Closing Prisma database connection...');
    await this.$disconnect();
    this.logger.info('Database connection closed');
  }
}
```

---

## 5. API Design Review

### Endpoint Naming
```
Module này không cung cấp HTTP API Endpoint nào. [N/A]
```

### Response Shape
```typescript
// Module này không có Endpoint.
```

### HTTP Status Codes
```
Module này không có Endpoint.
```

---

## 6. Cách Debug khi gặp lỗi

### Lỗi Crash khi khởi động app: Failed to connect to database

```
Checklist:
1. Kiểm tra biến môi trường `DATABASE_URL` trong file `.env` hoặc hệ thống xem có truyền đúng thông tin kết nối không (username, password, port, db name).
2. Kiểm tra Database Server (PostgreSQL/MySQL/...) có đang chạy và mở cổng tương ứng không (ví dụ docker container có up không).
3. Kiểm tra Firewall/Network config nếu ứng dụng và Database nằm ở các server khác nhau.

Command debug:
→ Kiểm tra URL kết nối trong env: `rtk env | grep DATABASE_URL`
→ Thử ping database: `ping <db-host>` hoặc `telnet <db-host> <port>`
→ Xem đầy đủ log error từ Pino khi chạy ứng dụng: `rtk npm run start:dev`
```

---

## 7. Các Pattern quan trọng trong module này

### Pattern 1: Global Module & Inheritance (Kế thừa)
```typescript
// Tại sao dùng pattern này?
// → NestJS khuyến khích bọc các thư viện bên thứ 3 (như PrismaClient) vào một Injectable Service.
// → Bằng cách kế thừa `PrismaClient`, `PrismaService` vừa là một Provider có thể inject bằng Dependency Injection, vừa có sẵn các hàm như `this.user.findMany()`.

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
// ...
}

// Nếu KHÔNG dùng pattern này thì sao?
// → Ta sẽ phải khởi tạo PrismaClient thủ công ở mỗi module hoặc sử dụng một biến global kiểu cũ ngoài DI system của NestJS, làm mất đi khả năng quản lý dependency, logging và test mock.
```

---

## 8. Biến môi trường cần thiết

```env
DATABASE_URL=          # Chuỗi kết nối đến Database dùng cho Prisma (vd: postgresql://user:pass@localhost:5432/mydb?schema=public)
```

---

## 9. Khi AI agent làm việc với module này

**Trước khi thêm feature mới:**
- Bất kỳ thay đổi cấu hình nào liên quan đến Database Connection (như Prisma middlewares, logging query) đều phải được thực hiện trong `PrismaService` (ở constructor hoặc hook).

**Khi sửa phần nhạy cảm của module:**
- Không xóa hay bỏ đi `@Global()` trong `PrismaModule` vì sẽ làm gãy (break) toàn bộ các module khác đang ngầm định dùng `PrismaService`.
- Luôn giữ lại logic logging trong `onModuleInit` vì nó cực kỳ quan trọng cho khâu DevOps và deploy.

**Khi thêm endpoint mới:**
- (Không áp dụng vì đây là database module)

**Khi debug:**
- Bắt đầu xem log khởi động app. Nếu có chữ "Failed to connect to database" thì chắc chắn lỗi nằm ở tầng infrastructure (chưa bật db, sai chuỗi kết nối).
