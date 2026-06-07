### Guard

**1. `implements CanActivate`**
- Interface bắt buộc implement `canActivate(context): boolean | Promise<boolean>`
- Trả về false vs throw exception: khác nhau thế nào (false → 403, throw → exception handler)

**2. `canActivate` từng bước:**
- `context.switchToHttp().getRequest()` → tại sao phải switch context, Guard dùng được cho cả HTTP + WebSocket + gRPC
- `request.headers.authorization?.split(' ')` → format `Bearer <token>`, tại sao split lấy index 1
- Optional chaining `?.` → nếu header không tồn tại thì sao
- `jwtService.verifyAsync(token)` → async tại sao, verify secret ở đâu (lấy từ JwtModule config)
- `request['user'] = { id: payload.sub, email: payload.email }` → tại sao `payload.sub` không phải `payload.id` (JWT standard: subject = sub)
- try/catch → tại sao bắt tất cả error thành UnauthorizedException thay vì rethrow

**3. Tại sao Guard không phải Middleware**
- Middleware: chạy trước route matching, không biết handler nào sẽ xử lý
- Guard: có `ExecutionContext` → biết class nào, method nào, metadata nào
- Ví dụ: `@Roles('admin')` decorator trên method → Guard đọc được, Middleware không đọc được
- `Reflector` để đọc custom metadata chỉ hoạt động trong Guard/Interceptor

**4. CurrentUser Decorator**
Giải thích custom param decorator này theo các điểm sau:

**1. createParamDecorator là gì**
- Factory function của NestJS tạo ra custom decorator cho tham số
- Nhận vào callback `(data, ctx) => returnValue`
- `data`: giá trị truyền vào decorator nếu có, ví dụ @CurrentUser('id') thì data = 'id'
- `ctx`: ExecutionContext, giống Guard có thể switch sang HTTP/WS/RPC
- Return value của callback → được inject vào tham số của method controller

**2. Tại sao không dùng @Req() trực tiếp**
- @Req() trả về toàn bộ request object → controller biết quá nhiều về HTTP internals
- @CurrentUser() trả về đúng shape { id, email } → controller chỉ biết thứ nó cần
- Test: mock @CurrentUser() dễ hơn mock toàn bộ Request object
- Tái sử dụng: có thể gọi @CurrentUser() ở bất kỳ controller nào có JwtAuthGuard

**3. ExecutionContext trong Decorator vs Guard**
- Trong Guard: dùng để quyết định cho phép hay chặn request (return boolean)
- Trong Decorator: dùng để trích xuất và transform data từ request
- Cả hai đều dùng ctx.switchToHttp().getRequest() để lấy request object
- Khác nhau: Decorator KHÔNG thể chặn request, chỉ đọc và trả về data

**4. Dependency giữa CurrentUser và JwtAuthGuard**
- CurrentUser đọc request.user mà JwtAuthGuard đã gán vào
- Nếu đặt @CurrentUser() trên route KHÔNG có JwtAuthGuard → request.user = undefined
- Không có compile-time error, chỉ bị undefined lúc runtime → bug khó phát hiện
- Best practice: luôn đi kèm @UseGuards(JwtAuthGuard) khi dùng @CurrentUser()

**5. Tại sao dùng request['user'] không phải request.user**
- TypeScript: Express Request type không có thuộc tính user theo mặc định
- Dùng bracket notation để tránh TypeScript compile error
- Giải pháp đúng hơn: extend Express.Request interface qua declaration merging

---
### Guard diagram [GHI VÀO FILE: -flows.md]

Vẽ luồng canActivate:
- Nhận request
- Extract token từ header
- Verify JWT
- Các nhánh fail (missing, malformed, expired)
- Success: attach user vào request
