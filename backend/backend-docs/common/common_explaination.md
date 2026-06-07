---

# Common Module — AI Coding Skill Context

> File này dùng làm context cho AI coding agent khi làm việc với Common module.

---

## 1. Kiến trúc tổng thể — Tại sao tổ chức như vậy?

```text
Global Level / Module Level
    │
    ▼
LoggingInterceptor      ← Ghi nhận mọi Request đi vào và thời gian phản hồi.
    │
    ▼
[Business Modules]      ← Thực thi nghiệp vụ, sử dụng Repositories kế thừa BaseRepository.
    │
    ▼
AllExceptionsFilter     ← Bắt mọi lỗi xảy ra ở bất cứ đâu và định dạng lại trước khi trả cho user.
```

**Tại sao tách các layer?**
- Các thành phần trong `common/` được thiết kế để tách biệt các vấn đề chung (cross-cutting concerns) ra khỏi logic nghiệp vụ (business logic).
- Chứa các `abstract class` (như `BaseRepository`) hoặc `interface` để tuân thủ nguyên lý Dependency Inversion, giúp mã dễ dàng mock khi test và thay đổi provider (ví dụ thay S3 bằng GCS dễ dàng thông qua `IStorageProvider`).

---

## 2. Các Dependencies

| Dependency | Vai trò |
|------------|---------|
| `PinoLogger` | Ghi log thống nhất chuẩn JSON (structured logging) trên toàn ứng dụng. |
| `HttpAdapterHost` | Cung cấp phương thức để phản hồi trả về client trực tiếp từ Filter mà không phụ thuộc cứng vào Express/Fastify. |
| `PrismaService` | Được sử dụng trong `BaseRepository` làm cơ sở thực hiện các thao tác DB. |

---

## 3. Entry Points — Đi đâu về đâu

> Vì Common không chứa Controller định tuyến trực tiếp, các "Entry Points" ở đây là các thời điểm hệ thống can thiệp vào request lifecycle.

### Filter Xử lý Lỗi (Exception Handling)

```text
Nơi bất kỳ sinh lỗi (ví dụ: Service ném BadRequestException)
    │
    ▼ AllExceptionsFilter.catch(exception)
    │   1. Phân loại Exception (HttpException hay Prisma Error).
    │   2. Map mã P2002 -> Conflict, P2025 -> NotFound.
    │   3. Ghi log error/warn.
    │
    ▼ Trả về JSON: { statusCode, message, code, timestamp, path }
```

### Logging Interceptor (Interception Lifecycle)

```text
Mọi HTTP Request đi vào API
    │
    ▼ LoggingInterceptor.intercept()
    │   1. Lưu thời gian `now`.
    │   2. Chuyển cho Controller.
    │   3. Khi Request xong -> tap() tính toán duration và gọi `logger.info()`.
```

---

## 4. Đánh giá — Đã tốt chưa?

### ✅ Đã làm tốt

| Điểm tốt | Lý do |
|----------|-------|
| Bắt lỗi Prisma tập trung | Xử lý lỗi `PrismaClientKnownRequestError` trong `AllExceptionsFilter` và `BaseRepository` giúp service không phải try-catch lặp lại liên tục cho lỗi trùng lặp (P2002) hay không tìm thấy (P2025). |
| Kế thừa BaseRepository | Việc đóng gói các hàm Prisma cơ bản trong `BaseRepository` giúp giảm code lặp ở các class con. |
| Logging chi tiết | `LoggingInterceptor` log kèm `duration`, `query`, `params` rất hữu ích khi truy vết latency hoặc debug bug theo từng request cụ thể. |

### ❌ Chưa tốt / Cần cải thiện

**1. Trùng lặp logic bắt lỗi Prisma**
```typescript
// HIỆN TẠI — vấn đề:
// AllExceptionsFilter đang cố gắng map lỗi Prisma (P2002, P2025), trong khi BaseRepository cũng thực hiện việc ném NotFound/Conflict exception dựa trên cùng mã lỗi đó qua hàm `handlePrismaError()`. Sự trùng lặp này không cần thiết, BaseRepository đã biến đổi nó thành HttpException nên Filter không bao giờ bắt được PrismaClientKnownRequestError trừ phi truy vấn DB nằm ngoài BaseRepository.

// NÊN SỬA — lý do:
// Nếu muốn giữ Prisma exception mapping, nên tập trung để 1 nơi duy nhất là Filter. Nếu dùng BaseRepository thì bỏ mapping ở Filter cho gọn.
```

**2. Có 2 Filter xử lý Http Exceptions**
```typescript
// HIỆN TẠI:
// Tồn tại cả `AllExceptionsFilter` và `HttpExceptionFilter`. `AllExceptionsFilter` đã bọc toàn bộ trường hợp của `HttpException`.

// NÊN SỬA:
// Xóa bỏ `HttpExceptionFilter` dư thừa, chỉ cấu hình `AllExceptionsFilter` làm global filter ở main.ts.
```

---

## 5. API Design Review

> Không có REST endpoints trong thư mục Common, bỏ qua phần Endpoint Naming.

### Response Shape (Của Global Filter)
```typescript
// Exception Response trả về:
{
  statusCode: number, // HTTP Code
  message: string,    // Chi tiết lỗi
  code: string,       // Custom code như ERR_CONFLICT, ERR_BAD_REQUEST
  timestamp: string,  // ISO time
  path: string        // Request URL
}
```

---

## 6. Cách Debug khi gặp lỗi

### Lỗi 500 Internal Server Error ẩn

```text
Checklist:
1. Xem log backend sinh bởi `PinoLogger` có message "Unhandled Exception" do `AllExceptionsFilter` sinh ra.
2. Kiểm tra xem lỗi đó có thuộc về Prisma (các mã ngoại lệ chưa định nghĩa ở Filter) hay là từ code logic.

Command debug:
→ Chạy `rtk log backend` để theo dõi log JSON. Tìm từ khóa `"statusCode": 500`.
```

---

## 7. Các Pattern quan trọng trong module này

### Pattern 1: Base Repository (Abstract Class Wrapper)
```typescript
// Tại sao dùng pattern này?
// → Abstract đi phần thao tác cơ bản với database. Code các Repo con chỉ việc `export class UserRepository extends BaseRepository<User, Prisma.UserDelegate>`.

export abstract class BaseRepository<T, Delegate> {
  constructor(protected prisma: PrismaService, protected delegate: Delegate) {}
  
  async findUnique(args: any): Promise<T | null> {
    try {
      return await (this.delegate as any).findUnique(args);
    } catch (error) {
      return this.handlePrismaError(error);
    }
  }
}

// Nếu KHÔNG dùng pattern này thì sao?
// → Mỗi repository phải viết lại hàm try/catch và ánh xạ error cho từng phương thức crud cơ bản.
```

### Pattern 2: Global Exception Handling
```typescript
// Tại sao dùng pattern này?
// → Giúp Controller không bao giờ cần try/catch, luôn ném exception và có một lớp duy nhất đón để format lại chuỗi JSON trả về cho frontend đồng nhất.

@Catch()
export class AllExceptionsFilter implements ExceptionFilter { ... }
```

---

## 8. Biến môi trường cần thiết

```env
# Mặc dù không trực tiếp gọi, thư mục này dựa vào Prisma và Logger, do đó gián tiếp cần:
DATABASE_URL=          # Kết nối đến DB cho Prisma
```

---

## 9. Khi AI agent làm việc với module này

**Trước khi thêm tính năng vào Common:**
- Phải chắc chắn thành phần này được chia sẻ và sử dụng bởi ít nhất 2 module khác nhau.
- Interface phải được định nghĩa rõ ràng (chỉ chứa `signature`, không chứa `implementation`).

**Khi sửa Filters/Interceptors:**
- Lưu ý thay đổi format response của `AllExceptionsFilter` sẽ ảnh hưởng đến CÁCH frontend bắt lỗi (frontend dựa vào `statusCode` hoặc `code`).
- Cẩn thận khi thêm logic nặng vào `LoggingInterceptor` vì nó chạy ở MỌI request, làm chậm hệ thống.

**Khi debug:**
- Lỗi từ DB luôn ném qua `BaseRepository`, hãy xem log `Pino` bắt tại `AllExceptionsFilter`.
