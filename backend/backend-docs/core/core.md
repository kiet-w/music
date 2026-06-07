# Core (App) Documentation

## 1. Tổng quan Kiến trúc (Component Overview)
Thành phần `Core` (bao gồm `AppController` và `AppService`) đóng vai trò là điểm vào (entry point) mặc định của ứng dụng NestJS. Nó cung cấp một endpoint gốc (`/`) cơ bản nhất để kiểm tra xem server có đang hoạt động và phản hồi đúng cách hay không.

## 2. Các Dependencies (Dependencies Injection)
- **`AppService`**: Được inject vào `AppController` thông qua cơ chế Dependency Injection để cung cấp logic sinh ra chuỗi phản hồi mặc định.

## 3. Phân tích chi tiết Controller, Service, Guard, v.v.
### 3.1. AppController (`app.controller.ts`)
Các Decorators:
- `@Controller()`: Định nghĩa class này là một controller để nhận và xử lý các HTTP requests từ phía client. Mặc định ánh xạ tới route gốc `/`.
- `@Get()`: Định nghĩa HTTP GET method cho endpoint gốc.

**Các endpoint (Public Methods):**
- **`getHello()`**: 
  - Vai trò: Xử lý request GET tại route `/`.
  - Tham số: Không có.
  - Logic: Gọi phương thức `getHello()` của `AppService`.
  - Return: Trả về một chuỗi string (kết quả từ Service).

### 3.2. AppService (`app.service.ts`)
Các Decorators:
- `@Injectable()`: Đánh dấu class này là một provider có thể được khởi tạo và quản lý bởi hệ thống Dependency Injection (IoC container) của NestJS.

**Các Public Methods:**
- **`getHello()`**:
  - Tham số: Không có.
  - Logic: Sinh ra một chuỗi văn bản tĩnh.
  - Return: Chuỗi string `'Hello World!'`.
