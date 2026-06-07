# Auth Module Documentation

## 1. Tổng quan Kiến trúc (Component Overview)
Module `Auth` chịu trách nhiệm xử lý toàn bộ các luồng xác thực (authentication) và cấp quyền truy cập vào hệ thống. Bao gồm các tính năng: đăng ký tài khoản truyền thống (email/password), đăng nhập truyền thống, đăng nhập qua Google OAuth, kiểm tra trạng thái liên kết với Google Drive, cũng như các thao tác cơ bản để lấy thông tin của chính mình và danh sách user trong hệ thống.

## 2. Các Dependencies (Dependencies Injection)
- **`PrismaModule`**: Được inject qua `AuthModule` để cung cấp Prisma instance cho quá trình tương tác Database (thông qua `PrismaService` dùng trong `UserRepository`).
- **`JwtModule`**: Cung cấp `JwtService` dùng để tạo và xác thực JSON Web Token (JWT). Cấu hình bất đồng bộ dùng `ConfigService`.
- **`ConfigService`**: Truy xuất các biến môi trường cấu hình (`JWT_SECRET`, `JWT_EXPIRES_IN`, `GOOGLE_CLIENT_ID`).
- **`PinoLogger` (nestjs-pino)**: Dùng để ghi log các sự kiện trong quá trình xác thực (auth service, guard).
- **`OAuth2Client` (google-auth-library)**: SDK của Google để xác thực `idToken` lấy từ phía client.
- **`UserRepository`**: Đóng gói các hàm truy vấn database liên quan tới bảng `User`.

## 3. Phân tích chi tiết Controller, Service, Guard, v.v.

### 3.1. AuthController (`auth.controller.ts`)
Các Decorators:
- `@ApiTags('auth')`, `@Controller('auth')`: Gắn Swagger tag và prefix route là `/auth`.
- `@Post`, `@Get`: Định nghĩa HTTP method.
- `@ApiOperation`, `@ApiResponse`: Sinh tài liệu Swagger.
- `@HttpCode(HttpStatus.OK)`: Chỉ định HTTP Status code trả về.
- `@UseGuards(JwtAuthGuard)`: Yêu cầu Request phải đính kèm JWT Token hợp lệ để vượt qua Guard.
- `@ApiBearerAuth()`: Chỉ định yêu cầu Bearer token trên Swagger UI.
- `@Body()`, `@Query()`, `@CurrentUser()`: Extract tham số tương ứng từ HTTP Request.

**Các endpoint (Public Methods):**
- **`register(registerDto: RegisterDto)`**: Nhận data từ body (email, password, name) -> gọi `AuthService.register()`. Trả về 201 Created hoặc 409 Conflict.
- **`login(loginDto: LoginDto)`**: Nhận data đăng nhập -> gọi `AuthService.login()`. Trả về 200 OK hoặc 401 Unauthorized.
- **`googleLogin(googleLoginDto: GoogleLoginDto)`**: Lấy `idToken` từ body -> gọi `AuthService.googleLogin()`. Trả về 200 OK.
- **`me(user)`**: Yêu cầu xác thực JWT. Lấy user id và email từ token nhờ `@CurrentUser()` decorator -> gọi `AuthService.me()`.
- **`googleStatus(user)`**: Yêu cầu JWT. Trả về trạng thái liên kết Google của user thông qua `AuthService.getGoogleStatus()`.
- **`findAll(page, limit)`**: Yêu cầu JWT. Lấy tất cả user với phân trang -> Tính toán tham số `skip` và `take` rồi gọi `AuthService.findAll()`.

### 3.2. AuthService (`auth.service.ts`)
#### Các Public Methods:
- **`register(dto: RegisterDto)`**:
  - Tham số: `dto` (email, password, name).
  - Logic: Chuẩn hóa email bằng `toLowerCase()`. Kiểm tra xem email tồn tại chưa (gọi `userRepository.findByEmail`). Nếu có ném ra `ConflictException`. Băm password với `bcrypt.hash(..., 12)`, gọi repository tạo user mới. Ghi log `User registered successfully`.
  - Return: Gọi helper `buildAuthResponse()` để trả về object chứa token và user info.
- **`login(dto: LoginDto)`**:
  - Tham số: `dto` (email, password).
  - Logic: Chuẩn hóa email bằng `trim().toLowerCase()`, tìm user trong DB. So khớp mật khẩu với hàm `bcrypt.compare()`.
  - Return: Nếu hợp lệ trả về `buildAuthResponse()`. Ném `UnauthorizedException` nếu thất bại.
- **`googleLogin(idToken: string)`**:
  - Tham số: `idToken` (Google cấp cho client).
  - Logic: Gọi helper `verifyGoogleToken` để xác thực với Google. Sau đó gọi `findOrCreateGoogleUser` để liên kết hoặc tạo user mới.
  - Return: `buildAuthResponse()`. Bắt lỗi ném ra `UnauthorizedException`.
- **`me(userId: string)`**:
  - Tham số: `userId`.
  - Logic: Truy vấn user theo id từ repository.
  - Return: Thông tin cơ bản (id, email, name).
- **`getGoogleStatus(userId: string)`**:
  - Tham số: `userId`.
  - Logic: Truy vấn user. Dựa vào trường `googleRefreshToken` để biết user đã cấp quyền Google Drive cho app hay chưa.
  - Return: `{ linked: boolean, email?: string }`.
- **`findAll(skip: number, take: number)`**:
  - Tham số: `skip`, `take`.
  - Logic: Gọi đồng thời hàm `count()` và `findMany()` trong `userRepository` qua `Promise.all` để lấy tổng số và dữ liệu.
  - Return: Object chứa danh sách người dùng (`data`), `total`, `page`, `limit`, `totalPages`.

#### Các Private Methods (Helpers):
- **`buildAuthResponse(user: User)`**: Nhận vào 1 `User` object, sử dụng `JwtService.sign` tạo Access Token (payload: sub = user.id, email = user.email), trả về cấu trúc `AuthResponseDto`.
- **`verifyGoogleToken(idToken: string)`**: Gửi idToken lên Google (thông qua `googleClient.verifyIdToken`) lấy Payload. Nếu không có payload hoặc email, ném lỗi `UnauthorizedException`. Trả về object `{ googleId, email, name }`.
- **`findOrCreateGoogleUser(googleId: string, email: string, name?: string)`**:
  - Logic: Tìm user có cùng `googleId`. Nếu có trả về luôn. Nếu chưa, tìm user theo `email`. Nếu tìm thấy, liên kết account bằng cách cập nhật `googleId`. Nếu không, tạo user mới.

### 3.3. UserRepository (`user.repository.ts`)
Các hàm Public:
- Kế thừa `BaseRepository<User, Prisma.UserDelegate>`. Inject `PrismaService`.
- **`findByEmail(email: string)`**: Query `this.prisma.user.findUnique` với điều kiện email.
- **`findByGoogleId(googleId: string)`**: Query `this.prisma.user.findUnique` với điều kiện googleId.

### 3.4. JwtAuthGuard (`jwt-auth.guard.ts`)
Guard bảo vệ router:
- Kế thừa `CanActivate`.
- **`canActivate(context: ExecutionContext)`**: Trích xuất token. Nếu không có token -> ghi log warn -> 401. Dùng `jwtService.verifyAsync` xác thực Token. Thành công -> lấy payload gán vào `request['user']`. Thất bại -> ghi log warn -> 401.
- **`extractTokenFromHeader(request: Request)` (Private)**: Tách chuỗi header `Authorization: Bearer <token>`.

### 3.5. CurrentUser Decorator (`current-user.decorator.ts`)
- Custom Parameter Decorator: Lấy giá trị `request.user` được `JwtAuthGuard` gán trước đó, đưa vào Controller dưới dạng tham số.
