### DTO (Data Transfer Object)

BẮT BUỘC liệt kê và giải thích TẤT CẢ các field có trong DTO.

**1. Với TỪNG field:**
- **Decorator validator**: `@IsEmail()`, `@IsString()`, `@IsOptional()`, `@Min(...)`, v.v.
- Ý nghĩa của validator: Ràng buộc dữ liệu đầu vào là gì.
- Tại sao dùng validator đó (ví dụ: Tại sao mật khẩu cần `@MinLength(8)`).
- Kiểu dữ liệu (TypeScript Type) của field đó.
- Nếu field là optional (`?` hoặc `@IsOptional`): Điều gì xảy ra nếu client không gửi field này.

**2. ValidationPipe behavior & Security**
- Tại sao cần DTO thay vì dùng `any` hay raw request body.
- Cơ chế `whitelist: true` giúp chống lại **Mass Assignment Attack** như thế nào.
- Transform dữ liệu (nếu có config).

**3. API Documentation (Swagger)**
- `@ApiProperty()` nếu có: Giải thích cách nó hiển thị trên tài liệu API.


---
### DTO diagram [GHI VÀO FILE: -flows.md]

Vẽ luồng ValidationPipe xử lý request body:
- Raw request body đến
- Từng validator chạy theo thứ tự
- whitelist strip
- Transform
- Pass hoặc throw 400
