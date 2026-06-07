## 4. System Data Flow

**1. POST `/auth/register` (register)**
- Client -> Controller (`register()`) -> Service (`register()`) -> Repository (`findByEmail()`) -> DB (Kiểm tra) -> Service (Băm password qua `bcrypt`) -> Repository (`create()`) -> DB (Lưu) -> Service (`buildAuthResponse()` -> `JwtService.sign()`) -> Controller -> Client.

**2. POST `/auth/login` (login)**
- Client -> Controller (`login()`) -> Service (`login()`) -> Repository (`findByEmail()`) -> DB (Lấy password hash) -> Service (`bcrypt.compare()`) -> Service (`buildAuthResponse()` -> `JwtService.sign()`) -> Controller -> Client.

**3. POST `/auth/google` (googleLogin)**
- Client -> Controller (`googleLogin()`) -> Service (`googleLogin()`) -> Service (`verifyGoogleToken()`) -> API Google Auth -> Service (`findOrCreateGoogleUser()`) -> Repository (`findByGoogleId()`, `findByEmail()`, `update()` / `create()`) -> DB -> Service (`buildAuthResponse()` -> `JwtService.sign()`) -> Controller -> Client.

**4. GET `/auth/me` (me)**
- Client -> `JwtAuthGuard` (`canActivate()` -> `extractTokenFromHeader()`) -> `JwtService.verifyAsync()` -> Guard gán payload vào `request.user` -> Controller (`me()` sử dụng `@CurrentUser()`) -> Service (`me()`) -> Repository (`findUnique()`) -> DB -> Service -> Controller -> Client.

**5. GET `/auth/google/status` (googleStatus)**
- Client -> `JwtAuthGuard` -> `JwtService.verifyAsync()` -> `request.user` -> Controller (`googleStatus()`) -> Service (`getGoogleStatus()`) -> Repository (`findUnique()`) -> DB -> Service -> Controller -> Client.

**6. GET `/auth/users` (findAll)**
- Client -> `JwtAuthGuard` -> `JwtService.verifyAsync()` -> Controller (`findAll()` xử lý query params) -> Service (`findAll()`) -> Repository (`count()` & `findMany()`) qua `Promise.all` -> DB -> Service -> Controller -> Client.
