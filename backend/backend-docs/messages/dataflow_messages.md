## 4. System Data Flow

**1. POST `/messages` (create)**
- Flow: Client -> `JwtAuthGuard` (xác thực token) -> `ClassSerializerInterceptor` -> Controller (`create()`) -> Service (`create()`) -> Repository (`create()`) -> Database (Lưu tin nhắn mới) -> Service -> Controller (`plainToInstance` mapping ra `MessageResponseDto`) -> Client.

**2. GET `/messages/:userId` (findAllByConversation)**
- Flow: Client -> `JwtAuthGuard` -> `ClassSerializerInterceptor` -> Controller (`findAllByConversation()`) -> Service (`findAllByConversation()`) -> Repository (`findConversation()`) -> Database (Truy vấn theo OR và sắp xếp asc) -> Service -> Controller (`plainToInstance`) -> Client.

**3. POST `/friend-requests/invite` (createInvite)**
- Flow: Client -> `JwtAuthGuard` -> Controller (`createInvite()`) -> Service (`createInvite()`) -> Service (Sinh UUID cho `token` & set `expiresAt` là +24h) -> Repository (`create()`) -> Database (Lưu lời mời mới) -> Service -> Controller -> Client.

**4. GET `/friend-requests/info/:token` (getInviteInfo)**
- Flow: Client -> Controller (`getInviteInfo()`) -> Service (`getInviteInfo()`) -> Repository (`findByToken()`) -> Database (Tìm thông tin kèm relation sender) -> Service (Verify trạng thái PENDING. Nếu quá hạn `expiresAt` -> Repository update thành EXPIRED) -> Database -> Service -> Controller -> Client.

**5. POST `/friend-requests/accept/:token` (acceptInvite)**
- Flow: Client -> `JwtAuthGuard` -> Controller (`acceptInvite()`) -> Service (`acceptInvite()`) -> Service (`getInviteInfo()` để xác thực lại token) -> Repository (`findByToken()`) -> Database -> Service (Check điều kiện tự accept bản thân) -> Repository (`update()` sang trạng thái ACCEPTED) -> Database (Lưu trạng thái mới) -> Service -> Controller -> Client.
