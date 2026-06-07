### Module

**1. `@Module` decorator metadata**
- `imports`: module khác cần dùng → tại sao import JwtModule ở đây
- `controllers`: NestJS biết route nào cần register
- `providers`: DI container biết class nào injectable
- `exports`: module khác có thể dùng gì từ module này

**2. `JwtModule.registerAsync`**
- Tại sao `registerAsync` không phải `register` trực tiếp → ConfigService chưa available lúc sync register
- `inject: [ConfigService]` → inject vào factory function
- `useFactory` → factory pattern, return config object
- `config.get('JWT_SECRET')` → nếu env var không set thì trả về undefined → JWT sign với undefined secret → security hole

**2b. Tại sao registerAsync không phải register — NestJS boot sequence**
Khi gặp JwtModule.registerAsync, giải thích boot sequence:
**NestJS khởi động theo 3 giai đoạn:**
1. Module scanning: NestJS đọc tất cả @Module decorator, xây dependency graph
2. Provider instantiation: Tạo instance các provider theo thứ tự dependency
3. Route registration: Đăng ký controllers và routes
**Vấn đề với register() sync:**
- JwtModule.register({ secret: configService.get('JWT_SECRET') }) ← KHÔNG được
- Lúc module scanning (giai đoạn 1), configService chưa được instantiate
- configService.get() sẽ trả về undefined
- JWT sẽ sign token bằng secret = undefined → security hole nghiêm trọng
- Không có error lúc startup, chỉ phát hiện khi token bị verify fail
**registerAsync giải quyết thế nào:**
- Nhận { inject: [ConfigService], useFactory: (config) => ({...}) }
- NestJS đợi đến giai đoạn 2 khi ConfigService đã được instantiate
- Sau đó inject ConfigService vào factory function
- Factory chạy → lúc này config.get('JWT_SECRET') đã có giá trị thật
- Return config object → JwtModule dùng để cấu hình
**inject: [ConfigService] vs imports: [ConfigModule]**
- inject[]: danh sách provider được truyền vào factory function làm tham số
- useFactory nhận đúng số tham số bằng số phần tử trong inject[]
- ConfigModule phải được import ở AppModule (global) hoặc AuthModule để ConfigService available

**3. `exports: [AuthService, JwtModule]`**
- Tại sao export JwtModule: module khác cần verify JWT (ví dụ WebSocket gateway) không cần import lại
- Không export UserRepository: encapsulation, module khác không nên trực tiếp query User table

**4. NestJS DI Container — tại sao khai báo providers[] là dùng được**
Giải thích cơ chế Dependency Injection khi gặp @Module:
**IoC Container là gì**
- NestJS dùng Inversion of Control container (IoC) để quản lý lifecycle của objects
- Thay vì bạn tự new AuthService() → NestJS tạo và quản lý instance cho bạn
- Lợi ích: 1 instance duy nhất được share (singleton), không tạo nhiều lần
**providers[] làm gì khi module boot**
- NestJS đọc providers: [AuthService, UserRepository, JwtAuthGuard]
- Với mỗi class, đọc constructor để biết cần inject gì
- AuthService constructor cần UserRepository và JwtService
- NestJS tìm UserRepository trong providers[] → tạo instance
- NestJS tìm JwtService trong imports[JwtModule].exports → lấy instance đã có
- Tạo AuthService instance, truyền các dependency vào constructor
- Lưu instance vào container map: { AuthService → instance }
**Tại sao phải export nếu muốn dùng ở module khác**
- Container của mỗi module là isolated (đóng gói)
- Module A không tự nhiên thấy providers của Module B
- exports: [AuthService] → đưa instance vào "public interface" của AuthModule
- Module C imports: [AuthModule] → có thể inject AuthService từ AuthModule
- Không export → inject ở module khác → Error: "Nest can't resolve dependencies"
**@Injectable() decorator làm gì**
- Đánh dấu class này có thể được quản lý bởi NestJS IoC container
- Không có @Injectable() → NestJS không biết class này là provider → không inject được
- Emit metadata về constructor params → NestJS dùng để biết cần inject gì
**Singleton scope (mặc định)**
- Mỗi provider chỉ được tạo 1 lần trong module
- Tất cả nơi inject AuthService đều nhận cùng 1 instance
- Lợi ích: không tốn memory, state shared
- Lưu ý: nếu Service lưu state trong property → state shared giữa tất cả requests (bug tiềm ẩn)
- Request scope: tạo instance mới cho mỗi request → dùng khi cần isolate state theo request

---
### Module diagram [GHI VÀO FILE: -flows.md]

Vẽ dependency graph của module:
- Module ở trung tâm
- Imports từ đâu
- Providers nào
- Exports ra ngoài gì
- Ai inject ai (mũi tên)
