---

# Root Module — AI Coding Skill Context

> File này dùng làm context cho AI coding agent khi làm việc với Root Module.

---

## 1. Kiến trúc tổng thể — Tại sao tổ chức như vậy?

```
main.ts (Entry Point)
    │
    ▼
NestFactory             ← Khởi tạo ứng dụng, thiết lập Global Configs (Pipes, Filters, CORS, Swagger, Logger)
    │
    ▼
AppModule               ← Module trung tâm kết nối toàn bộ hệ thống
    │
    ├── Global Modules  ← ConfigModule (Env), LoggerModule (Pino), CacheModule
    ├── Interceptors    ← LoggingInterceptor (Global)
    └── Sub-Modules     ← Auth, Songs, Albums, Prisma, Jobs, Storage, v.v.
```

**Tại sao tách các layer?**
- **Centralized Configuration:** Tất cả các tuỳ chỉnh toàn cục (global pipeline) được thiết lập ở `main.ts` giúp người quản trị dễ dàng nhìn thấy toàn bộ middleware hoặc rules của ứng dụng trong nháy mắt. `AppModule` chỉ làm nhiệm vụ "lắp ráp" các building blocks (modules).
- **Global Pipes/Filters/Interceptors:** Bằng cách khai báo ở `main.ts` hoặc qua `APP_INTERCEPTOR` ở `app.module.ts`, chúng ta không cần phải định nghĩa rải rác ở từng endpoint/module. Mọi logic bắt lỗi và validate DTO được đồng nhất.

---

## 2. Các Dependencies

| Dependency | Vai trò |
|------------|---------|
| `ConfigModule` | Nạp biến môi trường từ file `.env` thành biến global dùng chung cho toàn bộ app. |
| `LoggerModule` | Thay thế hệ thống log mặc định của Nest bằng thư viện Pino, giúp in log dưới dạng JSON có cấu trúc khi ở production, hỗ trợ tracking dễ hơn. |
| `CacheModule` | Cung cấp In-Memory Caching mặc định cho toàn app với TTL 60s. |

---

## 3. Entry Points — Đi đâu về đâu

*(Root module không trực tiếp xử lý logic nghiệp vụ qua HTTP endpoint ngoài việc khởi động ứng dụng và các route health-check cơ bản do `AppController` đảm nhiệm).*

### Server Bootstrap

```
Lệnh khởi chạy: npm run start / node dist/main.js
    │
    ▼ main.ts: bootstrap()
    │   1. Load `.env` (dotenv) để nạp cấu hình hệ thống
    │   2. Khởi tạo AppContext thông qua AppModule
    │   3. Thiết lập CORS, Filters, ValidationPipe
    │
    ▼ Khởi động HTTP Server trên PORT
    │
    ▼ Trả về: Ứng dụng sẵn sàng trên cổng chỉ định (ví dụ: 3002).

Lỗi có thể xảy ra:
- Crash ngay lúc khởi động do thiếu biến môi trường quan trọng, cổng bị chiếm, hoặc kết nối DB ở submodule lỗi.
```

---

## 4. Đánh giá — Đã tốt chưa?

### ✅ Đã làm tốt

| Điểm tốt | Lý do |
|----------|-------|
| Sử dụng `nestjs-pino` thay cho default logger | Hiệu năng tốt hơn và log xuất ra dưới chuẩn JSON, cực kỳ phù hợp cho ELK stack / Datadog khi deploy lên server cloud. |
| Validation Pipe chặt chẽ | Option `whitelist: true` và `forbidNonWhitelisted: true` tự động gạt bỏ các thuộc tính rác/không mong muốn khỏi request, ngăn chặn việc khai thác lỗ hổng Mass Assignment. |
| Tách biệt môi trường cho Logger | Config logger pino-pretty cho `development` dễ nhìn log, nhưng dùng dạng thô trên `production` tối ưu tài nguyên. |

### ❌ Chưa tốt / Cần cải thiện

**1. Khai báo CacheModule chưa tối ưu cho Scale**
```typescript
// HIỆN TẠI — vấn đề:
CacheModule.register({
  isGlobal: true,
  ttl: 60000,
}),

// NÊN SỬA — lý do:
// Nếu server scale ra nhiều instance (horizonal scaling), in-memory cache sẽ bị lệch (inconsistent) giữa các nodes. Nên sử dụng Redis làm store thay vì default in-memory.
```

**2. Cấu hình .env chưa có Validation**
```typescript
// HIỆN TẠI:
ConfigModule.forRoot({
  isGlobal: true,
}),

// NÊN SỬA:
// Nên tích hợp thư viện Joi để validate các biến môi trường khi start app, tránh trường hợp quên điền biến gây lỗi ẩn ở Runtime.
ConfigModule.forRoot({
  isGlobal: true,
  validationSchema: Joi.object({
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().required(),
  })
})
```

---

## 5. API Design Review

### Endpoint Naming
```
(Chưa có endpoint cụ thể trong Root Module, xem thêm ở các Sub-Module)
```

### Response Shape
```typescript
// Định dạng Response chung khi có lỗi (xử lý bởi AllExceptionsFilter):
// (Tham khảo luồng chung của hệ thống)
```

### HTTP Status Codes
```
(Dựa trên ValidationPipe, các lỗi sai payload sẽ tự động map ra status 400 Bad Request)
```

---

## 6. Cách Debug khi gặp lỗi

### Lỗi Ứng dụng Crash khi vừa khởi động (Exit Code 1)

```
Checklist:
1. Kiểm tra lại file `.env` xem đã cung cấp đủ các biến chưa.
2. Kiểm tra xem port (mặc định 3002 trong `.env`) có đang bị chiếm bởi một process khác không.

Command debug:
→ Chạy `rtk env` để kiểm tra các cấu hình môi trường đang nạp
→ Chạy lệnh start bằng tay để xem callstack lỗi trên console.
```

### Lỗi Validation Pipe (Client phàn nàn 400 Bad Request với field lạ)

```
Checklist:
1. Xác định DTO của endpoint đang thiếu khai báo `@IsString()`, `@IsOptional()`... nên bị `whitelist` hoặc `forbidNonWhitelisted` bắt lại.
2. Cập nhật class DTO đó bằng các class-validator decorators cho khớp với Payload mong muốn.
```

---

## 7. Các Pattern quan trọng trong module này

### Pattern 1: Global Decorator/Interceptor qua APP_* Token
```typescript
// Tại sao dùng pattern này?
// → Đăng ký Interceptor ở `app.module.ts` qua token `APP_INTERCEPTOR` giúp Interceptor tự động áp dụng lên mọi route mà vẫn có khả năng inject các dependencies (ví dụ nếu cần gọi Database log) nhờ sức mạnh của DI container.

{
  provide: APP_INTERCEPTOR,
  useClass: LoggingInterceptor,
}

// Nếu KHÔNG dùng pattern này thì sao?
// → Bạn sẽ phải dùng `app.useGlobalInterceptors(new LoggingInterceptor())` ở `main.ts`, lúc này Interceptor sẽ nằm ngoài tầm quản lý của DI container của NestJS, không thể `@Inject()` service khác được.
```

---

## 8. Biến môi trường cần thiết

```env
PORT=                  # Cổng mà server sẽ lắng nghe (mặc định 3000 nếu không có)
DATABASE_URL=          # Chuỗi kết nối Database Postgres
NODE_ENV=              # Phân định môi trường: "development" / "production" (ảnh hưởng log format)
```

---

## 9. Khi AI agent làm việc với module này

**Trước khi thêm feature mới:**
- Bất cứ module độc lập nghiệp vụ nào được tạo ra, bắt buộc phải khai báo vào list `imports` của `AppModule` thì nó mới có hiệu lực.
- Bất cứ module cấu hình chia sẻ nào (như Mailer, S3 Storage) muốn gọi mọi nơi không cần import lại, cần set `isGlobal: true` lúc đăng ký.

**Khi sửa cấu hình toàn cục (`main.ts`):**
- KHÔNG vô hiệu hóa `whitelist: true` và `forbidNonWhitelisted: true` của `ValidationPipe` vì đây là cơ chế phòng vệ bảo mật cơ bản nhất của ứng dụng.

**Khi debug:**
- Bắt đầu debug bằng cách quan sát log console nhờ pino-pretty, do cấu hình filter global, mọi exception sẽ được bắn thẳng ra màn hình dev ở định dạng có timestamp.
