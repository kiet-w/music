# Auth Module Documentation

## 1. Tổng quan Kiến trúc (Component Overview)
Module `Auth` chịu trách nhiệm xử lý toàn bộ các luồng xác thực (authentication) và cấp quyền truy cập vào hệ thống. Bao gồm các tính năng: đăng ký tài khoản truyền thống (email/password), đăng nhập truyền thống, đăng nhập qua Google OAuth, kiểm tra trạng thái liên kết với Google Drive, cũng như các thao tác cơ bản để lấy thông tin của chính mình và danh sách user trong hệ thống.

## 2. Các Dependencies (Dependencies Injection)
- **`PrismaModule`**: Được inject qua `AuthModule` để cung cấp Prisma instance cho quá trình tương tác Database (thông qua UserRepository).
- **`JwtModule`**: Cung cấp `JwtService` dùng để tạo và xác thực JSON Web Token (JWT).
- **`ConfigService`**: Truy xuất các biến môi trường cấu hình (JWT_SECRET, JWT_EXPIRES_IN, GOOGLE_CLIENT_ID).
- **`PinoLogger` (nestjs-pino)**: Dùng để ghi log các sự kiện trong quá trình xác thực (auth service, guard).
- **`OAuth2Client` (google-auth-library)**: SDK của Google để xác thực `idToken` lấy từ phía client.
- **`UserRepository`**: Đóng gói các hàm truy vấn database liên quan tới bảng `User`.

## 3. Phân tích chi tiết Controller & Service
### 3.1. AuthController (`auth.controller.ts`)
Các Decorators: 
- `@ApiTags('auth')`, `@Controller('auth')`: Gắn Swagger tag và prefix route là `/auth`.
- `@Post`, `@Get`: Định nghĩa HTTP method.
- `@ApiOperation`, `@ApiResponse`: Sinh tài liệu Swagger.
- `@HttpCode(HttpStatus.OK)`: Chỉ định HTTP Status code trả về (thay vì 201 mặc định cho POST).
- `@UseGuards(JwtAuthGuard)`: Yêu cầu Request phải đính kèm JWT Token hợp lệ để vượt qua Guard.
- `@ApiBearerAuth()`: Chỉ định yêu cầu Bearer token trên Swagger UI.
- `@Body()`, `@Query()`, `@CurrentUser()`: Extract tham số tương ứng từ HTTP Request.

**Các endpoint (Public Methods):**
- **`register(registerDto: RegisterDto)`**: Nhận data từ body (email, password, name) -> gọi `AuthService.register()`.
- **`login(loginDto: LoginDto)`**: Nhận data đăng nhập -> gọi `AuthService.login()`.
- **`googleLogin(googleLoginDto: GoogleLoginDto)`**: Lấy `idToken` từ body -> gọi `AuthService.googleLogin()`.
- **`me(user)`**: Yêu cầu xác thực JWT. Lấy user id từ token nhờ `@CurrentUser()` decorator -> gọi `AuthService.me()`.
- **`googleStatus(user)`**: Yêu cầu JWT. Trả về trạng thái liên kết Google của user thông qua `AuthService.getGoogleStatus()`.
- **`findAll(page, limit)`**: Yêu cầu JWT. Lấy tất cả user với phân trang -> Tính toán tham số `skip` và `take` rồi gọi `AuthService.findAll()`.

### 3.2. AuthService (`auth.service.ts`)
#### Các Public Methods:
- **`register(dto: RegisterDto)`**:
  - Tham số: `dto` (email, password, name).
  - Logic: Chuẩn hóa email bằng `toLowerCase()`. Kiểm tra xem email tồn tại chưa (gọi `userRepository.findByEmail`). Nếu có ném ra `ConflictException`. Tiếp theo băm password với bcrypt, rồi gọi repository tạo user mới.
  - Return: Trả về access token và info cơ bản gọi qua `buildAuthResponse()`.
- **`login(dto: LoginDto)`**:
  - Tham số: `dto` (email, password).
  - Logic: Chuẩn hóa email và tìm user trong DB. So khớp mật khẩu với hàm `bcrypt.compare()`.
  - Return: Nếu hợp lệ trả về `buildAuthResponse()`. Ném `UnauthorizedException` nếu thất bại.
- **`googleLogin(idToken: string)`**:
  - Tham số: `idToken` (Google cấp cho client).
  - Logic: Gọi helper `verifyGoogleToken` để xác thực với Google. Sau đó gọi `findOrCreateGoogleUser` để liên kết hoặc tạo user mới.
  - Return: `buildAuthResponse()`.
- **`me(userId: string)`**:
  - Tham số: `userId`.
  - Logic: Truy vấn user theo id từ repository.
  - Return: Thông tin cơ bản (id, email, name).
- **`getGoogleStatus(userId: string)`**:
  - Tham số: `userId`.
  - Logic: Truy vấn user. Dựa vào `googleRefreshToken` để biết user đã cấp quyền Google Drive cho app hay chưa.
  - Return: `{ linked: boolean, email?: string }`.
- **`findAll(skip: number, take: number)`**:
  - Tham số: `skip` (số bản ghi bỏ qua), `take` (số bản ghi lấy).
  - Logic: Gọi đồng thời hàm `count()` và `findMany()` trong `userRepository` qua `Promise.all` để lấy tổng số và dữ liệu.
  - Return: Danh sách người dùng, tổng số, trang hiện tại, tổng số trang.

#### Các Private Methods (Helpers):
- **`buildAuthResponse(user: User)`**: Nhận vào 1 `User` object và sử dụng `JwtService.sign` để tạo Access Token (payload: sub = user.id, email = user.email), trả về cấu trúc response chuẩn (`AuthResponseDto`).
- **`verifyGoogleToken(idToken: string)`**: Sử dụng `googleClient.verifyIdToken` gửi idToken lên Google để lấy Payload. Nếu không có payload hoặc không có email, ném lỗi 401. Trả về object `{ googleId, email, name }`.
- **`findOrCreateGoogleUser(googleId: string, email: string, name?: string)`**:
  - Logic: Đầu tiên tìm user có cùng `googleId`. Nếu có thì trả về ngay. Nếu chưa, tìm user theo `email` (đã đăng ký trước bằng account thường). Nếu tìm thấy, liên kết account bằng cách cập nhật `googleId`. Nếu không thấy, tạo user mới 100%.

### 3.3. UserRepository (`user.repository.ts`)
Các hàm Public:
- Kế thừa `BaseRepository` của Prisma.
- **`findByEmail(email: string)`**: Query `.findUnique` dựa theo trường email.
- **`findByGoogleId(googleId: string)`**: Query `.findUnique` dựa theo trường googleId.

### 3.4. JwtAuthGuard (`jwt-auth.guard.ts`)
Guard kiểm tra tính hợp lệ của Request:
- Kế thừa `CanActivate` (triển khai phương thức `canActivate`).
- **`canActivate(context: ExecutionContext)`**: Lấy token từ header bằng hàm `extractTokenFromHeader`. Nếu không có -> 401. Sử dụng `jwtService.verifyAsync` để xác thực chữ ký của Token. Lấy payload và gán thông tin (id, email) vào `request['user']` để các controller downstream dùng. Nếu thất bại -> 401.
- **`extractTokenFromHeader(request: Request)` (Private)**: Bóc tách token từ header `Authorization: Bearer <token>`.

### 3.5. CurrentUser Decorator (`current-user.decorator.ts`)
- Custom Parameter Decorator để trích xuất `request.user` (đã được gán ở bước JwtAuthGuard). Nó giúp code ở controller gọn gàng hơn thay vì phải request.

## 4. System Data Flow

**1. POST `/auth/register` (register)**
- Flow: Client -> Controller (`register()`) -> Service (`register()`) -> Repository (`findByEmail()`) -> DB (Kiểm tra) -> Service (Băm password) -> Repository (`create()`) -> DB (Lưu) -> Service (`buildAuthResponse()` -> `JwtService.sign()`) -> Controller -> Client.

**2. POST `/auth/login` (login)**
- Flow: Client -> Controller (`login()`) -> Service (`login()`) -> Repository (`findByEmail()`) -> DB (Tìm user) -> Service (So sánh bcrypt) -> Service (`buildAuthResponse()` -> `JwtService.sign()`) -> Controller -> Client.

**3. POST `/auth/google` (googleLogin)**
- Flow: Client -> Controller (`googleLogin()`) -> Service (`googleLogin()`) -> Service (`verifyGoogleToken()`) -> Google API -> Service (`findOrCreateGoogleUser()`) -> Repository (`findByGoogleId()`, `findByEmail()`, `update()`/`create()`) -> DB -> Service (`buildAuthResponse()`) -> Controller -> Client.

**4. GET `/auth/me` (me)**
- Flow: Client -> `JwtAuthGuard` (`canActivate()` -> `extractTokenFromHeader()`) -> `JwtService.verifyAsync()` -> `request.user` -> Controller (`me()` via `@CurrentUser()`) -> Service (`me()`) -> Repository (`findUnique()`) -> DB -> Service -> Controller -> Client.

**5. GET `/auth/google/status` (googleStatus)**
- Flow: Client -> `JwtAuthGuard` -> `JwtService.verifyAsync()` -> Controller (`googleStatus()` via `@CurrentUser()`) -> Service (`getGoogleStatus()`) -> Repository (`findUnique()`) -> DB -> Service -> Controller -> Client.

**6. GET `/auth/users` (findAll)**
- Flow: Client -> `JwtAuthGuard` -> `JwtService.verifyAsync()` -> Controller (`findAll()` - xử lý phân trang) -> Service (`findAll()`) -> Repository (`count()` & `findMany()`) -> DB -> Service -> Controller -> Client.

---

# Auth Module — AI Coding Skill Context

> File này dùng làm context cho AI coding agent khi làm việc với Auth Module.

---

## 1. Kiến trúc tổng thể — Tại sao tổ chức như vậy?

```
HTTP Request
    │
    ▼
AuthController          ← Chỉ nhận/trả HTTP, định nghĩa route, gọi service tương ứng.
    │
    ▼
JwtAuthGuard            ← Middleware bảo vệ endpoint, kiểm tra token xác thực.
    │
    ▼
AuthService             ← Toàn bộ business logic: băm mật khẩu, tạo token, xử lý đăng nhập Google.
    │
    ▼
UserRepository          ← Tầng Database Access: tìm kiếm, tạo mới và cập nhật dữ liệu User.
    │
    ▼
[Database PostgreSQL]   ← Thông qua Prisma
```

**Tại sao tách các layer?**
- **Tách biệt mối quan tâm (Separation of Concerns):** `AuthController` chỉ quan tâm tới HTTP (Status codes, Params, Body), trong khi `AuthService` lo liệu logic nghiệp vụ lõi (hashing, xác thực JWT, Google Auth).
- **Single Responsibility:** Tách `UserRepository` thay vì dùng trực tiếp Prisma trong `AuthService` giúp dễ dàng stub/mock khi viết unit test và chuẩn hóa cách truy vấn DB theo ý muốn.
- **Tái sử dụng (Reusability):** `JwtAuthGuard` và `CurrentUser` decorator có thể sử dụng lại trên nhiều endpoint khác mà không lặp lại code kiểm tra header và token.

---

## 2. Các Dependencies

| Dependency | Vai trò |
|------------|---------|
| `UserRepository` | Giao tiếp với Database để query và thao tác với entity `User` (dựa trên Prisma). |
| `JwtService` | Ký (sign) token khi đăng nhập thành công và xác thực (verify) token trong Guard. |
| `ConfigService` | Lấy các biến môi trường cấu hình như `GOOGLE_CLIENT_ID`. |
| `PinoLogger` | Ghi log chuẩn cấu trúc (structured logging) theo vết các hoạt động như register, login lỗi, hay token hết hạn. |
| `OAuth2Client` | Thư viện `google-auth-library` dùng để xác thực `idToken` của Google. |
| `PrismaService` | Được inject trong `UserRepository` để cung cấp Prisma Client truy vấn DB. |

---

## 3. Entry Points — Đi đâu về đâu

### 3.1. POST /auth/register

```
Client gửi (Body: RegisterDto): { email, password, name }
    │
    ▼ Controller.register(registerDto)
    │   → Decorators: @Post('register'), @ApiOperation, @ApiResponse
    │
    ▼ AuthService.register(dto)
    │   1. Chuyển email sang chữ thường (toLowerCase)
    │   2. UserRepository.findByEmail(email) → Kiểm tra trùng lặp email. Nếu có → ConflictException(409).
    │   3. bcrypt.hash() → Mã hóa password thành chuỗi hash (cost: 12).
    │   4. UserRepository.create() → Tạo user mới vào DB.
    │   5. Ghi log thành công.
    │
    ▼ AuthService.buildAuthResponse(user) (Private Method)
    │   → Ký JWT Access Token (JwtService.sign).
    │
    ▼ Trả về: { accessToken, user: { id, email, name } }

Lỗi có thể xảy ra:
- 409 ConflictException → Email đã tồn tại.
```

### 3.2. POST /auth/login

```
Client gửi (Body: LoginDto): { email, password }
    │
    ▼ Controller.login(loginDto)
    │   → Decorators: @Post('login'), @HttpCode(200)
    │
    ▼ AuthService.login(dto)
    │   1. Clean email (trim, toLowerCase).
    │   2. UserRepository.findByEmail(email) → Tìm user theo email.
    │   3. Nếu không có user hoặc passwordHash là null → UnauthorizedException(401).
    │   4. bcrypt.compare() → So sánh password với passwordHash. Nếu sai → 401.
    │
    ▼ AuthService.buildAuthResponse(user) (Private Method)
    │   → Ký JWT Access Token.
    │
    ▼ Trả về: { accessToken, user: { id, email, name } }

Lỗi có thể xảy ra:
- 401 UnauthorizedException → Sai tài khoản hoặc mật khẩu.
```

### 3.3. POST /auth/google

```
Client gửi (Body: GoogleLoginDto): { idToken }
    │
    ▼ Controller.googleLogin(googleLoginDto)
    │
    ▼ AuthService.googleLogin(idToken)
    │   │
    │   ▼ AuthService.verifyGoogleToken(idToken) (Private Method)
    │       1. googleClient.verifyIdToken() → Kiểm tra idToken với Google server.
    │       2. Trích xuất payload (googleId, email, name). Nếu không có email → 401.
    │   │
    │   ▼ AuthService.findOrCreateGoogleUser(googleId, email, name) (Private Method)
    │       1. UserRepository.findByGoogleId(googleId) → Tìm user.
    │       2. Nếu không thấy: UserRepository.findByEmail(email) → Tìm theo email.
    │           - Nếu có: UserRepository.update() → Liên kết googleId vào user có sẵn.
    │           - Nếu không có: UserRepository.create() → Tạo user mới với googleId.
    │   │
    │   ▼ AuthService.buildAuthResponse(user) (Private Method)
    │       → Ký JWT Access Token.
    │
    ▼ Trả về: { accessToken, user: { id, email, name } }

Lỗi có thể xảy ra:
- 401 UnauthorizedException → Token Google không hợp lệ hoặc lỗi kết nối với Google.
```

### 3.4. GET /auth/me

```
Client Request (Header: Authorization: Bearer <token>)
    │
    ▼ JwtAuthGuard.canActivate()
    │   1. extractTokenFromHeader(request) (Private Method) → lấy Bearer token.
    │   2. JwtService.verifyAsync() → Giải mã token. Nếu lỗi → 401.
    │   3. Gắn payload vào `request.user`.
    │
    ▼ Controller.me(user)
    │   → Decorators: @Get('me'), @UseGuards(JwtAuthGuard), @CurrentUser
    │   → @CurrentUser sẽ trích xuất `request.user` đưa vào controller.
    │
    ▼ AuthService.me(userId)
    │   1. UserRepository.findUnique(userId) → Lấy chi tiết user. Nếu không có → 401.
    │
    ▼ Trả về: { id, email, name }

Lỗi có thể xảy ra:
- 401 UnauthorizedException → Không có token, token hết hạn, hoặc User không tồn tại nữa.
```

### 3.5. GET /auth/google/status

```
Client Request (Header: Authorization: Bearer <token>)
    │
    ▼ JwtAuthGuard.canActivate() → Giải mã và gắn `user` vào Request.
    │
    ▼ Controller.googleStatus(user)
    │
    ▼ AuthService.getGoogleStatus(userId)
    │   1. UserRepository.findUnique(userId) → Nếu không có → 401.
    │
    ▼ Trả về: { linked: boolean, email?: string } (kiểm tra trường `googleRefreshToken`)

Lỗi có thể xảy ra:
- 401 UnauthorizedException → Thiếu token, token sai, hoặc user không tồn tại.
```

### 3.6. GET /auth/users

```
Client Request: /auth/users?page=1&limit=10 (Header: Authorization: Bearer <token>)
    │
    ▼ JwtAuthGuard.canActivate() → Kiểm tra JWT.
    │
    ▼ Controller.findAll(page, limit)
    │   1. Tính toán `skip` và `take` dựa trên page & limit. Mặc định: take = 50, skip = 0.
    │
    ▼ AuthService.findAll(skip, take)
    │   1. Chạy Promise.all:
    │       - UserRepository.count() → Đếm tổng user.
    │       - UserRepository.findMany({ skip, take, orderBy: { createdAt: 'desc' } }) → Lấy danh sách.
    │
    ▼ Trả về: { data, total, page, limit, totalPages }

Lỗi có thể xảy ra:
- 401 UnauthorizedException → Vấn đề về auth.
```

---

## 4. Đánh giá — Đã tốt chưa?

### ✅ Đã làm tốt

| Điểm tốt | Lý do |
|----------|-------|
| Clean Architecture ở Layer mức Controller/Service | Việc xử lý HTTP Request (tính toán skip/take) ở Controller và để Repository lo việc query DB là cực kỳ chuẩn xác theo mô hình NestJS. |
| Quản lý lỗi Auth Guard với Logger | Khi có lỗi Token, Guard không chỉ ném lỗi mà còn ghi chú lại warning với thư viện `PinoLogger`, hỗ trợ tốt việc dò lỗi Security. |
| Google Identity Link (Account Linking) | Phương thức `findOrCreateGoogleUser` xử lý được case người dùng đăng ký qua email thường, sau đó đăng nhập bằng Google (cùng email), hệ thống sẽ gộp (link) thay vì báo lỗi. |

### ❌ Chưa tốt / Cần cải thiện

**1. Xử lý tính Pagination thủ công ở Controller**
```typescript
// HIỆN TẠI — vấn đề:
// Controller tự phân tích chuỗi query sang Int, tính công thức skip. Không an toàn (ví dụ: page = -1)
const skip = page && limit ? (parseInt(page, 10) - 1) * parseInt(limit, 10) : 0;
const take = limit ? parseInt(limit, 10) : 50;

// NÊN SỬA — lý do:
// Nên dùng Pipe (ParseIntPipe) kết hợp với Validation Dto (PaginationDto) để bắt lỗi ở đầu nguồn.
@Query() paginationDto: PaginationDto
// và tính toán skip, take nên được đưa vào Service hoặc dùng một helper phân trang chuẩn.
```

**2. Bảo mật thiếu Role Guard cho endpoint xem toàn bộ Users**
```typescript
// HIỆN TẠI — vấn đề:
@Get('users')
@UseGuards(JwtAuthGuard)
async findAll(...)

// NÊN SỬA — lý do:
// Bất cứ ai có Jwt Token đều xem được danh sách User (lộ lọt dữ liệu). Nên giới hạn với Role ADMIN.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
```

---

## 5. API Design Review

### Endpoint Naming
```
POST /auth/register     [✅] Đạt tiêu chuẩn.
POST /auth/login        [✅] Đạt tiêu chuẩn.
POST /auth/google       [✅] Rõ ràng, cho thấy login bằng nhà cung cấp Google.
GET  /auth/me           [✅] Chuẩn convention RESTful lấy thông tin bản thân.
GET  /auth/google/status[⚠️] Nên đổi thành GET /auth/integrations/google hoặc để trong User Profile module thì hợp lý hơn.
GET  /auth/users        [❌] Quản lý users (`/users`) không nên đặt trong `/auth`. Nên tách ra thành module/Controller riêng (Ví dụ: `UsersController` ở endpoint `/users`).
```

### Response Shape
```typescript
// Endpoint /auth/register, /auth/login, /auth/google trả về:
{
  accessToken: string, // JWT Bearer token được ký bằng secret dùng để gắn vào Authorization header.
  user: {
    id: string,        // UUID hoặc CUID định danh User
    email: string,     // Địa chỉ email người dùng
    name: string       // Tên người dùng hiển thị
  }
}
```

### HTTP Status Codes
```
POST /auth/register  → 201 Created   [✅]
POST /auth/login     → 200 OK        [✅] (Dùng @HttpCode(HttpStatus.OK) chuẩn xác vì POST thường trả về 201)
POST /auth/google    → 200 OK        [✅]
GET  /auth/me        → 200 OK        [✅]
```

---

## 6. Cách Debug khi gặp lỗi

### Lỗi 401 UnauthorizedException khi gọi API cần Auth

```
Checklist:
1. Kiểm tra Request Header xem đã truyền `Authorization: Bearer <Token>` chưa.
2. Token đã hết hạn chưa? (Decode trên jwt.io).
3. Secret Key trên Server (`JWT_SECRET`) có khớp với Secret lúc ký Token không?

Command debug:
→ Xem log của Pino trên backend: tìm kiếm keyword 'Auth failed: Invalid token'
→ Giải mã payload JWT nếu cần để xem ID:
   cat token.txt | jwt decode
```

### Lỗi đăng nhập Google thất bại

```
Checklist:
1. Kiểm tra `idToken` Google gửi lên có hợp lệ không.
2. Kiểm tra `GOOGLE_CLIENT_ID` trong server config (file `.env`) có chính xác và trùng với Client ID trên FE hay không.

Command debug:
→ Xem log backend: "Google authentication failed"
→ Đảm bảo config được nạp đúng qua lệnh check ENV: `rtk env | grep GOOGLE`
```

---

## 7. Các Pattern quan trọng trong module này

### Pattern 1: Repository Pattern với Prisma
```typescript
// Tại sao dùng pattern này?
// → Giảm sự phụ thuộc cứng vào ORM (Prisma) ở tầng Service.
// → Gom nhóm các truy vấn cụ thể và cho phép test DB dễ dàng bằng việc mock Repository.

export class UserRepository extends BaseRepository<User, Prisma.UserDelegate> {
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }
}

// Nếu KHÔNG dùng pattern này thì sao?
// → AuthService sẽ trực tiếp gọi `this.prisma.user.findUnique()`. Code trở nên lộn xộn, khi cần đổi logic caching hoặc thay ORM khác sẽ phải sửa vô số file Service.
```

### Pattern 2: Custom Param Decorator (`@CurrentUser`)
```typescript
// Tại sao dùng pattern này?
// → Giúp Controller trích xuất đối tượng User từ Request một cách tường minh và sạch sẽ.
// → Đóng gói logic truy cập `request.user` ở một nơi.

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest().user;
  },
);

// Nếu KHÔNG dùng pattern này thì sao?
// → Trong Controller sẽ phải gọi `@Req() request` và viết `request.user.id`, gây khó test và làm giảm độ tường minh của Input API.
```

---

## 8. Biến môi trường cần thiết

```env
JWT_SECRET=            # Secret key được JwtModule sử dụng để ký và giải mã Token
JWT_EXPIRES_IN=        # Thời gian hết hạn của token (ví dụ: '15m', '7d')
GOOGLE_CLIENT_ID=      # ID client của ứng dụng cấp bởi Google Cloud Console dùng để verify idToken
```

---

## 9. Khi AI agent làm việc với module này

**Trước khi thêm feature mới:**
- Logic xác thực, mã hóa và verify JWT/Google tuyệt đối phải nằm trong `AuthService`, không lọt ra ngoài Controller.
- Bất kỳ câu truy vấn DB mới nào (ví dụ: update token, khóa tài khoản) phải được đóng gói thành method mới trong `UserRepository`.

**Khi sửa phần nhạy cảm của module (Login/Register/Guard):**
- KHÔNG được thay đổi chu trình `bcrypt.hash()` hay giảm tham số `cost` (mặc định 12) vì sẽ gây lỗi cho các dữ liệu cũ và làm giảm tính bảo mật.
- Luôn cẩn thận khi sửa `JwtAuthGuard` để tránh vô tình vô hiệu hóa chức năng bảo mật cho toàn hệ thống.

**Khi thêm endpoint mới:**
- Bắt buộc gắn @ApiOperation và @ApiResponse nếu nó là Public API.
- Nếu endpoint yêu cầu bảo mật, phải có @UseGuards(JwtAuthGuard) và @ApiBearerAuth() để Swagger hiển thị đúng.

**Khi debug:**
- Bắt đầu debug từ file log được tạo bởi PinoLogger, tìm các message lỗi được khai báo trong `catch` block hoặc Guard trước tiên.
