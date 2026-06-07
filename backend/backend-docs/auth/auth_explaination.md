---

# Auth Module — AI Coding Skill Context

> File này dùng làm context cho AI coding agent khi làm việc với Auth Module.

---

## 1. Kiến trúc tổng thể — Tại sao tổ chức như vậy?

```text
HTTP Request
    │
    ▼
AuthController          ← Chỉ nhận/trả HTTP, định tuyến request và parse body/query. KHÔNG chứa business logic.
    │
    ▼
JwtAuthGuard            ← Middleware bảo vệ các endpoint yêu cầu xác thực, decode JWT token.
    │
    ▼
AuthService             ← Toàn bộ business logic: băm mật khẩu, tạo token, xử lý đăng nhập Google, quản lý data flow.
    │
    ▼
UserRepository          ← Tầng Database Access: chuyên tương tác với entity User.
    │
    ▼
[Database PostgreSQL]   ← Thông qua Prisma.
```

**Tại sao tách các layer?**
- **Separation of Concerns (Tách biệt trách nhiệm):** Controller chỉ xử lý HTTP request/response. Service xử lý nghiệp vụ, Repository xử lý query DB.
- Giúp code dễ test hơn (có thể dễ dàng mock Repository để test Service).
- Tăng khả năng tái sử dụng (Guard, Decorator, Repository có thể dùng ở module khác).

---

## 2. Các Dependencies

| Dependency | Vai trò |
|------------|---------|
| `UserRepository` | Giao tiếp với Database để query và thao tác với entity `User` qua Prisma. |
| `JwtService` | Ký (sign) token khi đăng nhập thành công và giải mã (verify) token trong Guard. |
| `ConfigService` | Lấy biến môi trường (`JWT_SECRET`, `GOOGLE_CLIENT_ID`, v.v.). |
| `PinoLogger` | Ghi log chuẩn cấu trúc cho các hoạt động đăng ký, đăng nhập và xác thực (thành công/lỗi). |
| `OAuth2Client` | SDK của Google (từ `google-auth-library`) để verify `idToken`. |
| `PrismaService` | Được inject trong Repository để thực hiện câu lệnh DB. |

---

## 3. Entry Points — Đi đâu về đâu

### POST /auth/register

```text
Client gửi: { email, password, name }
    │
    ▼ Controller.register(registerDto)
    │   → Nhận request và chuyển tiếp body.
    │
    ▼ Service.register(dto)
    │   1. Chuyển email sang lowercase, gọi Repo kiểm tra trùng.
    │   2. Băm mật khẩu (bcrypt hash).
    │   3. Tạo bản ghi mới trong DB, log thành công, sinh token.
    │
    ▼ Trả về: { accessToken, user: { id, email, name } }

Lỗi có thể xảy ra:
- 409 ConflictException → Email đã tồn tại.
```

### POST /auth/login

```text
Client gửi: { email, password }
    │
    ▼ Controller.login(loginDto)
    │   → Nhận request và chuyển tiếp body.
    │
    ▼ Service.login(dto)
    │   1. Trim và lowercase email, tìm trong DB.
    │   2. So sánh mật khẩu bằng bcrypt.
    │   3. Sinh token.
    │
    ▼ Trả về: { accessToken, user: { id, email, name } }

Lỗi có thể xảy ra:
- 401 UnauthorizedException → Thông tin đăng nhập không hợp lệ.
```

### POST /auth/google

```text
Client gửi: { idToken }
    │
    ▼ Controller.googleLogin(googleLoginDto)
    │   → Nhận token từ Google Client.
    │
    ▼ Service.googleLogin(idToken)
    │   1. verifyGoogleToken: Xác thực qua Google API, lấy email.
    │   2. findOrCreateGoogleUser: Tìm user (theo googleId hoặc email). Liên kết hoặc tạo mới.
    │   3. Sinh token của hệ thống.
    │
    ▼ Trả về: { accessToken, user: { id, email, name } }

Lỗi có thể xảy ra:
- 401 UnauthorizedException → Token Google không hợp lệ hoặc lỗi API Google.
```

### GET /auth/me

```text
Client Request (Header: Authorization: Bearer <token>)
    │
    ▼ JwtAuthGuard.canActivate()
    │   → Lấy token từ header, verify, gán thông tin user (id, email) vào Request.
    │
    ▼ Controller.me(user)
    │   → Trích xuất qua @CurrentUser.
    │
    ▼ Service.me(userId)
    │   1. Lấy thông tin user trong DB.
    │
    ▼ Trả về: { id, email, name }

Lỗi có thể xảy ra:
- 401 UnauthorizedException → Không truyền token, token sai hoặc hết hạn.
```

### GET /auth/google/status

```text
Client Request (Header: Authorization: Bearer <token>)
    │
    ▼ Controller.googleStatus(user)
    │   → Xử lý thông qua JWT Guard.
    │
    ▼ Service.getGoogleStatus(userId)
    │   1. Lấy thông tin user từ DB.
    │   2. Kiểm tra xem user có trường `googleRefreshToken` hay không.
    │
    ▼ Trả về: { linked: boolean, email?: string }

Lỗi có thể xảy ra:
- 401 UnauthorizedException → Token không hợp lệ.
```

### GET /auth/users

```text
Client Request (Header: Authorization: Bearer <token>, Query: ?page=1&limit=50)
    │
    ▼ Controller.findAll(page, limit)
    │   → Tính toán số lượng cần `skip` và `take` dựa trên page, limit.
    │
    ▼ Service.findAll(skip, take)
    │   1. Query đồng thời đếm số lượng tổng (count) và lấy danh sách (findMany).
    │
    ▼ Trả về: { data, total, page, limit, totalPages }

Lỗi có thể xảy ra:
- 401 UnauthorizedException → Lỗi xác thực token.
```

---

## 4. Đánh giá — Đã tốt chưa?

### ✅ Đã làm tốt

| Điểm tốt | Lý do |
|----------|-------|
| Clean Architecture | Controller thuần túy xử lý HTTP (params, dto, status). Repository chỉ xử lý logic truy vấn DB. Service gom nhóm business logic (hashing, check trùng). |
| Error Logging | Sử dụng `PinoLogger` để log các sự kiện đăng ký và lỗi đăng nhập ở mức Guard và Service. Hữu ích trong security audit. |
| Account Linking | Luồng Google OAuth xử lý cực tốt tình huống người dùng từng tạo bằng email password sau đó chọn đăng nhập qua Google (cùng email). Nó liên kết thay vì tạo trùng lặp. |

### ❌ Chưa tốt / Cần cải thiện

**1. Tính toán Pagination thủ công tại Controller**
```typescript
// HIỆN TẠI — vấn đề:
// Controller tự parse Int `page` và `limit`, viết code cứng, dễ bị lỗi (ví dụ chuỗi là chữ hoặc số âm).
const skip = page && limit ? (parseInt(page, 10) - 1) * parseInt(limit, 10) : 0;
const take = limit ? parseInt(limit, 10) : 50;

// NÊN SỬA — lý do:
// Nên tạo một `PaginationDto` kết hợp Pipe tự động validate số, và đưa logic tính `skip`, `take` vào lớp base hoặc service.
@Query() paginationDto: PaginationDto
```

**2. GET /auth/users không có kiểm tra quyền (Role Guard)**
```typescript
// HIỆN TẠI:
@Get('users')
@UseGuards(JwtAuthGuard)
async findAll(...)

// NÊN SỬA:
// Endpoint lấy toàn bộ user có thể làm rò rỉ dữ liệu, nên được giới hạn cho quyền ADMIN.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
```

---

## 5. API Design Review

### Endpoint Naming
```text
POST /auth/register       [✅] Rõ ràng, dễ hiểu.
POST /auth/login          [✅] Rõ ràng.
POST /auth/google         [✅] Đạt tiêu chuẩn cho OAuth provider login.
GET  /auth/me             [✅] Naming chuẩn RESTful cho thao tác lấy profile cá nhân.
GET  /auth/google/status  [⚠️] Tốt hơn nên đặt tại `/users/me/integrations/google` nếu hệ thống phức tạp, nhưng hiện tại tạm ổn.
GET  /auth/users          [❌] Không nên đặt list user trong auth module. Nên tách ra một `UsersController` route `/users`.
```

### Response Shape
```typescript
// Endpoint /auth/register, /auth/login, /auth/google trả về:
{
  accessToken: string, // JWT sử dụng ở header Authorization
  user: {
    id: string,        // UUID user
    email: string,     // Địa chỉ email
    name: string       // Tên người dùng
  }
}
```

### HTTP Status Codes
```text
POST /auth/register → 201  [✅] Sinh mới data.
POST /auth/login    → 200  [✅] Do sử dụng @HttpCode(HttpStatus.OK).
POST /auth/google   → 200  [✅] Cùng lý do.
GET  /auth/me       → 200  [✅]
```

---

## 6. Cách Debug khi gặp lỗi

### Lỗi 401 Unauthorized khi truy cập API

```text
Checklist:
1. Đã truyền token vào request header `Authorization: Bearer <token>` chưa?
2. Token đã hết hạn chưa? (Decode ra xem claim `exp`).
3. Giá trị `JWT_SECRET` trong `.env` đã đúng chưa?

Command debug:
→ Xem log backend có dòng nào 'Auth failed: Invalid token' hoặc 'Auth failed: No token found in header' không.
```

### Lỗi 401 "Google authentication failed"

```text
Checklist:
1. Token `idToken` gửi lên từ Frontend có đúng do Google SDK trả về không?
2. Client ID trên Frontend có match với `GOOGLE_CLIENT_ID` trên Backend không?

Command debug:
→ Xem log báo "Google login failed" để biết thêm chi tiết từ try catch block của Service.
```

---

## 7. Các Pattern quan trọng trong module này

### Pattern 1: Repository Pattern với `BaseRepository`
```typescript
// Tại sao dùng pattern này?
// → Giúp giảm sự ràng buộc giữa Service và ORM (Prisma). Dễ dàng mock khi viết Unit test mà không dính tới database thật.
// → Mở rộng các hàm tùy chỉnh thay vì lạm dụng `.findUnique` trên toàn bộ ứng dụng.

export class UserRepository extends BaseRepository<User, Prisma.UserDelegate> {
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }
}

// Nếu KHÔNG dùng pattern này thì sao?
// → AuthService phải gọi PrismaService trực tiếp, code rối và duplicate logic.
```

### Pattern 2: Custom Parameter Decorator
```typescript
// Tại sao dùng pattern này?
// → Giấu đi cấu trúc đối tượng `request` của Express. Làm cho chữ ký hàm controller tập trung vào payload cần thiết là `user`.

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest().user;
  },
);

// Nếu KHÔNG dùng pattern này thì sao?
// → Phải viết @Req() request, sau đó gán const user = request.user, làm code controller bị dính chặt với Express.
```

---

## 8. Biến môi trường cần thiết

```env
JWT_SECRET=            # Chuỗi bí mật để tạo JWT Token
JWT_EXPIRES_IN=        # Thời gian hết hạn (VD: 1d, 7d, 1h)
GOOGLE_CLIENT_ID=      # OAuth Client ID tạo tại Google Cloud Console
```

---

## 9. Khi AI agent làm việc với module này

**Trước khi thêm feature mới:**
- Luôn inject Repository thay vì Prisma trực tiếp.
- Các thao tác verify token, băm mật khẩu, business check phải để trong Service.

**Khi sửa phần nhạy cảm của module (Login/Register/Guard):**
- KHÔNG thay đổi số vòng lặp `bcrypt` (đang là 12) vì có thể break tốc độ phản hồi hoặc gây lỗi cho user mới.
- KHÔNG thay đổi Payload Token (sub, email) nếu không update cả `JwtAuthGuard`.

**Khi thêm endpoint mới:**
- Nhớ đánh dấu Swagger `@ApiOperation` và `@ApiResponse`.
- Endpoint cần đăng nhập bắt buộc phải có `@UseGuards(JwtAuthGuard)` và `@ApiBearerAuth()`.

**Khi debug:**
- Xem log được bắn ra từ `PinoLogger` trong Service (như log khi duplicate email hoặc login google error).
