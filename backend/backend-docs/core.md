# Module: core (Micro-Technical Detail)

Module `core` chứa các thành phần mặc định của ứng dụng NestJS, đóng vai trò cung cấp endpoint gốc (root endpoint) để kiểm tra tình trạng hoạt động (health check) của server.

---

## 1. Thành phần chính
- **Controller**: `src/core/app.controller.ts`
- **Service**: `src/core/app.service.ts`

---

## 2. Chi tiết Controller (`AppController`)

### `getHello` (`GET /`)
- **Impact**: Cung cấp endpoint gốc để kiểm tra xem API server đã khởi động và hoạt động bình thường chưa.
- **In/Out**:
    - **In**: Không có.
    - **Out**: `string` (Mặc định trả về "Hello World!").
- **Logic**: 
    - Gọi `this.appService.getHello()`.

---

## 3. Chi tiết Service (`AppService`)

### `getHello` (Public)
- **Impact**: Trả về một chuỗi tĩnh để response cho root endpoint.
- **Micro-Logic**:
    - `` `return 'Hello World!';` `` — Hardcode trả về chuỗi "Hello World!". Thường được dùng làm health check đơn giản trong các hệ thống monitoring.
