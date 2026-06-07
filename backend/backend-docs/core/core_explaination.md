---

# Core (App) — AI Coding Skill Context

> File này dùng làm context cho AI coding agent khi làm việc với Core (App).

---

## 1. Kiến trúc tổng thể — Tại sao tổ chức như vậy?

```
HTTP Request
    │
    ▼
AppController          ← Chỉ nhận/trả HTTP, KHÔNG chứa logic nghiệp vụ
    │
    ▼
AppService             ← Business logic nằm ở đây (sinh thông điệp trả về)
```

**Tại sao tách các layer?**
- **Tách biệt mối quan tâm (Separation of Concerns):** `AppController` chỉ quan tâm tới việc định tuyến HTTP request ở route root, còn `AppService` cung cấp dữ liệu trả về thực tế. Ngay cả với logic đơn giản nhất (trả về chuỗi cố định), việc tách biệt này giúp codebase tuân thủ nghiêm ngặt và nhất quán với kiến trúc chung của NestJS ngay từ đầu.

---

## 2. Các Dependencies

| Dependency | Vai trò |
|------------|---------|
| `AppService` | Cung cấp logic trả về thông điệp mặc định cho `AppController` thông qua Dependency Injection. |

---

## 3. Entry Points — Đi đâu về đâu

### GET /

```
Client gửi: {}
    │
    ▼ Controller.getHello()
    │   → Xử lý HTTP GET request tại root path `/`.
    │
    ▼ Service.getHello()
    │   1. Sinh chuỗi ký tự — 'Hello World!'
    │
    ▼ Trả về: "Hello World!" (Mặc định NestJS trả về text/html cho string)

Lỗi có thể xảy ra:
- Hiện tại endpoint này quá đơn giản, hầu như không phát sinh Exception ngoại trừ lỗi hệ thống chung.
```

---

## 4. Đánh giá — Đã tốt chưa?

### ✅ Đã làm tốt

| Điểm tốt | Lý do |
|----------|-------|
| Tuân thủ kiến trúc chuẩn | Đã tách bạch Controller và Service rõ ràng dù logic cực kỳ đơn giản. Giúp làm framework mẫu cho các thành phần phức tạp hơn. |
| Testable | `AppService` được inject qua constructor nên có thể dễ dàng mock trong `app.controller.spec.ts`. |

### ❌ Chưa tốt / Cần cải thiện

**1. Thiếu tính ứng dụng thực tế (Chưa có Health Check ý nghĩa)**
```typescript
// HIỆN TẠI — vấn đề:
// Chỉ trả về chuỗi 'Hello World!' không mang lại nhiều ý nghĩa giám sát hệ thống thật.
getHello(): string {
  return 'Hello World!';
}

// NÊN SỬA — lý do:
// Nên chuyển đổi endpoint này thành một Health Check API thực thụ hoặc trả về metadata API.
getHello(): Record<string, any> {
  return { 
    status: 'UP', 
    timestamp: new Date().toISOString() 
  };
}
```

---

## 5. API Design Review

### Endpoint Naming
```
GET /                 [⚠️] Dùng cho root path, thường dùng cho health check hoặc public meta data. Tuy nhiên trả về plain text 'Hello World!' thì không hữu ích lắm cho REST API.
```

### Response Shape
```typescript
// Endpoint / trả về text (string):
"Hello World!"
```

### HTTP Status Codes
```
GET / → 200 OK  [✅]
```

---

## 6. Cách Debug khi gặp lỗi

### Lỗi 404 Not Found tại Root Path

```
Checklist:
1. Đảm bảo `AppController` đã được khai báo trong mảng `controllers` của file cấu hình module (`app.module.ts`).
2. Kiểm tra xem trong file `main.ts` có thiết lập `app.setGlobalPrefix('api')` hay không. Nếu có, route sẽ trở thành `/api` thay vì `/`.

Command debug:
→ Xem log terminal ở thời điểm NestJS khởi động: Tìm dòng có chữ `[RoutesResolver] AppController {/}:`.
```

---

## 7. Các Pattern quan trọng trong module này

### Pattern 1: Dependency Injection
```typescript
// Tại sao dùng pattern này?
// → Giúp AppController không phải tự khởi tạo AppService bằng từ khóa `new`. 
// → Đảm bảo nguyên lý Inversion of Control (IoC), giúp code lỏng lẻo (loose coupling) và dễ viết unit test.

constructor(private readonly appService: AppService) {}

// Nếu KHÔNG dùng pattern này thì sao?
// → Controller sẽ gắn chặt cứng với implementation của Service, không thể truyền mock service vào khi test.
```

---

## 8. Biến môi trường cần thiết

```env
# Module cơ bản này chưa sử dụng biến môi trường nào.
```

---

## 9. Khi AI agent làm việc với module này

**Trước khi thêm feature mới:**
- Không nên nhồi nhét logic nghiệp vụ phức tạp vào `AppController` hay `AppService`. Các domain thực tế (như User, Auth, Product) cần được tạo bằng Module riêng biệt. Root controller chỉ nên dùng cho health checks, server metadata, hoặc trang landing mặc định.

**Khi sửa phần nhạy cảm của module:**
- Nếu quyết định thay đổi nội dung trả về của route `/`, hãy kiểm tra trước xem có các công cụ giám sát (monitoring tools / load balancers) nào đang phụ thuộc vào việc gọi root `/` để ping trạng thái server (uptime) không.

**Khi thêm endpoint mới:**
- Khuyến nghị tạo controller mới cho các feature mới. Tránh lạm dụng `AppController`.

**Khi debug:**
- Nếu route gốc trả về 404, hãy ngay lập tức kiểm tra file `main.ts` (xem có global prefix không) và file module cha (xem có thiếu import controller không).
