# Messages Module Documentation

## 1. Tổng quan Kiến trúc (Component Overview)
Module `Messages` chịu trách nhiệm quản lý hệ thống tin nhắn (chat) và lời mời kết bạn (friend requests). Nó cung cấp các tính năng: gửi tin nhắn trực tiếp giữa hai người dùng, lấy lịch sử trò chuyện (hội thoại 2 chiều), tạo đường dẫn/lời mời kết bạn (có thời hạn 24 giờ), xem chi tiết thông tin lời mời và chấp nhận lời mời thông qua token.

## 2. Các Dependencies (Dependencies Injection)
- **`PrismaModule`**: Được import vào `MessagesModule` để khởi tạo `PrismaService` phục vụ cho quá trình tương tác cơ sở dữ liệu.
- **`MessagesService`**: Xử lý logic nghiệp vụ liên quan tới tin nhắn giữa các người dùng.
- **`FriendRequestService`**: Xử lý logic nghiệp vụ liên quan tới luồng mời kết bạn (sinh token, kiểm tra thời hạn và trạng thái).
- **`MessageRepository`**: Đóng gói các truy vấn cơ sở dữ liệu liên quan đến entity `Message`.
- **`FriendRequestRepository`**: Đóng gói các truy vấn cơ sở dữ liệu liên quan đến entity `FriendRequest`.

## 3. Phân tích chi tiết Controller, Service, Guard, v.v.

### 3.1. MessagesController (`messages.controller.ts`)
Các Decorators:
- `@ApiTags('messages')`, `@Controller('messages')`: Gắn Swagger tag và prefix route HTTP là `/messages`.
- `@ApiBearerAuth()`: Chỉ định trên Swagger yêu cầu đính kèm token Bearer.
- `@UseGuards(JwtAuthGuard)`: Middleware bảo vệ endpoints, bắt buộc phải có JWT Token hợp lệ để truy cập.
- `@UseInterceptors(ClassSerializerInterceptor)`: Tự động tuần tự hóa và loại bỏ các trường nhạy cảm dựa trên khai báo của DTO trước khi trả response.
- `@Post()`, `@Get(':userId')`: Khai báo HTTP method và route param.
- `@ApiOperation`, `@ApiResponse`: Sinh tài liệu Swagger API chi tiết.

**Các endpoint (Public Methods):**
- **`create(user, createMessageDto: CreateMessageDto)`**: Nhận data từ body (content, receiverId) và id từ người dùng hiện tại -> gọi `MessagesService.create()`. Trả về tin nhắn đã tạo dưới dạng `MessageResponseDto`.
- **`findAllByConversation(user, otherUserId: string)`**: Lấy ID người thứ hai từ Param và ID của bản thân từ token -> gọi `MessagesService.findAllByConversation()`. Trả về lịch sử tin nhắn dạng `[MessageResponseDto]`.

### 3.2. MessagesService (`messages.service.ts`)
#### Các Public Methods:
- **`create(senderId: string, createMessageDto: CreateMessageDto)`**:
  - Tham số: `senderId`, `createMessageDto` (gồm content và receiverId).
  - Logic: Sử dụng `messageRepository.create()` để lưu tin nhắn mới vào database. Sử dụng cú pháp `connect` của Prisma để nối ID cho cả sender và receiver.
  - Return: Trả về đối tượng `Message` nguyên bản vừa tạo.
- **`findAllByConversation(userId1: string, userId2: string)`**:
  - Tham số: `userId1`, `userId2`.
  - Logic: Gọi `messageRepository.findConversation()` để truy xuất toàn bộ cuộc hội thoại.
  - Return: Danh sách đối tượng `Message`.

### 3.3. MessageRepository (`message.repository.ts`)
Các hàm Public:
- Kế thừa `BaseRepository` của Prisma.
- **`findConversation(userId1: string, userId2: string)`**: Truy vấn `.findMany()`. Tìm kiếm bằng điều kiện `OR`: (`senderId = userId1` VÀ `receiverId = userId2`) HOẶC (`senderId = userId2` VÀ `receiverId = userId1`), đồng thời sắp xếp tin nhắn theo thời gian tăng dần (`orderBy: { createdAt: 'asc' }`).

### 3.4. FriendRequestsController (`friend-requests.controller.ts`)
Các Decorators:
- `@ApiTags('friend-requests')`, `@Controller('friend-requests')`: Gắn Swagger tag và prefix `/friend-requests`.
- `@UseGuards(JwtAuthGuard)`, `@ApiBearerAuth()`: Áp dụng cho các endpoint tạo lời mời và chấp nhận lời mời.
- `@ApiOperation()`: Mô tả API.

**Các endpoint (Public Methods):**
- **`createInvite(req, dto: CreateFriendRequestDto)`**: Yêu cầu xác thực. Nhận `receiverId` (optional) từ body -> gọi `FriendRequestService.createInvite()`.
- **`getInviteInfo(token: string)`**: Public API (không có Guard). Lấy thông tin lời mời kết bạn từ `token` -> gọi `FriendRequestService.getInviteInfo()`.
- **`acceptInvite(req, token: string)`**: Yêu cầu xác thực. Chấp nhận lời mời dựa trên `token` và ID người dùng đăng nhập -> gọi `FriendRequestService.acceptInvite()`.

### 3.5. FriendRequestService (`friend-request.service.ts`)
#### Các Public Methods:
- **`createInvite(senderId: string, dto: CreateFriendRequestDto)`**:
  - Tham số: `senderId`, `dto`.
  - Logic: Tính toán thời điểm hết hạn (`expiresAt`) bằng cách cộng 24 giờ vào thời gian hiện tại. Sinh token dạng UUID v4. Cuối cùng, gọi repository để tạo lời mời mới.
  - Return: Đối tượng `FriendRequest` mới.
- **`getInviteInfo(token: string)`**:
  - Tham số: `token`.
  - Logic: Lấy lời mời từ repository (`findByToken`). Nếu không có: ném `NotFoundException`. Nếu `status !== PENDING`: ném `BadRequestException`. Nếu thời gian hiện tại lớn hơn `expiresAt`: cập nhật trạng thái ở CSDL thành `EXPIRED` và ném `BadRequestException`.
  - Return: Trả về thông tin lời mời nếu hợp lệ và còn hạn.
- **`acceptInvite(token: string, receiverId: string)`**:
  - Tham số: `token`, `receiverId`.
  - Logic: Đầu tiên, gọi `getInviteInfo(token)` để xác minh token hợp lệ. Kế tiếp kiểm tra xem `senderId` có trùng với `receiverId` không (tự mời bản thân), nếu có ném `BadRequestException`. Cuối cùng, gọi repository cập nhật `status = ACCEPTED` và điền `receiverId`.
  - Return: Đối tượng lời mời đã cập nhật.
- **`checkConnection(userId1: string, userId2: string)`**:
  - Tham số: `userId1`, `userId2`.
  - Logic: Tìm một `FriendRequest` giữa hai user đã mang trạng thái `ACCEPTED`.
  - Return: Giá trị `boolean` xác nhận hai người là bạn bè.

### 3.6. FriendRequestRepository (`friend-request.repository.ts`)
Các hàm Public:
- Kế thừa `BaseRepository`.
- **`findByToken(token: string)`**: Query `findUnique` theo token, bổ sung quan hệ `include` để truy xuất một số trường cơ bản của người gửi (`id`, `name`, `email`).
- **`findPendingRequest(senderId: string, receiverId: string)`**: Tìm lời mời giữa hai người đang mang trạng thái `PENDING`.

### 3.7. DTOs
- **`CreateMessageDto`**: Yêu cầu `content` (chuỗi) và `receiverId` (chuỗi UUID).
- **`MessageResponseDto`**: Cấu trúc trả về tin nhắn gồm: id, content, senderId, receiverId, createdAt.
- **`CreateFriendRequestDto`**: Cho phép `receiverId` là optional UUID.
- **`FriendRequestResponseDto`**: Cấu trúc trả về lời mời: id, token, senderId, receiverId, status, expiresAt, createdAt.
