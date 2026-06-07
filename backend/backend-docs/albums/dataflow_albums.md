## 4. System Data Flow

**1. POST `/albums` (create)**
- Flow: Client -> `JwtAuthGuard` (verify) -> `ClassSerializerInterceptor` -> Controller (`create()`) -> Service (`create()`) -> Repository (`create()`) -> DB (Lưu) -> Service (`mapAlbumResponse()`) -> Controller -> Client.

**2. GET `/albums` (findAll)**
- Flow: Client -> `JwtAuthGuard` -> `ClassSerializerInterceptor` -> Controller (`findAll()` - xử lý phân trang skip/take) -> Service (`findAll()`) -> Repository (`count()` & `findMany()`) chạy song song -> DB -> Service (dùng map chạy qua `mapAlbumResponse()`) -> Controller -> Client.

**3. GET `/albums/:id` (findOne)**
- Flow: Client -> `JwtAuthGuard` -> `ClassSerializerInterceptor` -> Controller (`findOne()`) -> Service (`findOne()`) -> Repository (`findFirst()`) -> DB -> Service (`mapAlbumResponse()`) -> Controller -> Nếu null -> Ném `NotFoundException` -> Client.

**4. Service method `findOrCreateDefault` (Không có Endpoint gọi trực tiếp)**
- Flow: Internal caller -> Service (`findOrCreateDefault()`) -> Repository (`findDefault()`) -> DB -> (Nếu null) -> Repository (`create()`) -> DB -> Nếu dính lỗi Race Condition -> Catch Error -> Repository (`findDefault()`) -> DB -> Service (`mapAlbumResponse()`) -> Internal caller.
