---

# Messages Module — AI Coding Skill Context

> File này dùng làm context cho AI coding agent khi làm việc với Messages Module.

---

## 1. Kiến trúc tổng thể — Tại sao tổ chức như vậy?

```
HTTP Request
    │
    ▼
MessagesController / FriendRequestsController  ← Chỉ nhận/trả HTTP, định tuyến API và mapping dữ liệu
    │
    ▼
JwtAuthGuard                                   ← Middleware bảo vệ endpoint, kiểm tra token xác thực
    │
    ▼
MessagesService / FriendRequestService         ← Chứa toàn bộ business logic (hạn token 24h, validate logic)
    │
    ▼
MessageRepository / FriendRequestRepository    ← Tầng Database Access: query phức tạp được đóng gói tại đây
    │
    ▼
[Database PostgreSQL]                          ← Thông qua Prisma
```

**Tại sao tách các layer?**
- **Tách biệt mối quan tâm (Separation of Concerns):** Controller chỉ lo liệu phần HTTP (param, body payload, guard). Service đảm nhận quy tắc nghiệp vụ phức tạp (ví dụ: tạo hạn 24 giờ, sinh mã token, kiểm tra không được tự kết bạn). Repository lo liệu cách giao tiếp với Prisma ORM, chẳng hạn viết query `OR` để lấy hội thoại hai chiều.
- **Khả năng Test & Bảo trì (Testability):** Việc tách logic CSDL xuống Repository giúp việc viết Unit Test cho Service dễ dàng thông qua mocking mà không phụ thuộc cứng vào Prisma.

---

## 2. Các Dependencies

| Dependency | Vai trò |
|------------|---------|
| `MessageRepository` | Tương tác trực tiếp với Database cho các truy vấn của thực thể `Message`. |
| `FriendRequestRepository` | Tương tác trực tiếp với Database cho thực thể `FriendRequest`. |
| `PrismaModule` | Khởi tạo và cung cấp đối tượng Prisma Client để Repository thực thi query. |

---

## 3. Entry Points — Đi đâu về đâu

### POST /messages

```
Client gửi: { content, receiverId }
    │
    ▼ Controller.create()
    │   → Lấy user id từ @CurrentUser() và DTO từ body, truyền cho Service.
    │
    ▼ Service.create()
    │   1. Map dữ liệu vào format kết nối Prisma relations (connect: id).
    │   2. Gọi MessageRepository.create() lưu tin nhắn.
    │
    ▼ Trả về: { id, content, senderId, receiverId, createdAt }

Lỗi có thể xảy ra:
- 401 Unauthorized → Token không hợp lệ.
- 400 BadRequest → Lỗi DTO (vd: thiếu content hoặc receiverId không phải UUID hợp lệ).
```

### GET /messages/:userId

```
Client gửi: param `userId` (ID của người muốn xem tin nhắn chung)
    │
    ▼ Controller.findAllByConversation()
    │   → Nhận `userId` mục tiêu, và ID của chính user đăng nhập từ token.
    │
    ▼ Service.findAllByConversation()
    │   1. Gọi MessageRepository.findConversation() truy vấn hội thoại 2 chiều.
    │
    ▼ Trả về: [ { id, content, senderId, receiverId, createdAt } ] (Mảng tin nhắn)

Lỗi có thể xảy ra:
- 401 Unauthorized → Token bị thiếu hoặc sai.
```

### POST /friend-requests/invite

```
Client gửi: { receiverId? }
    │
    ▼ Controller.createInvite()
    │   → Trích xuất ID user gửi lời mời.
    │
    ▼ Service.createInvite()
    │   1. Đặt `expiresAt` là 24 giờ kể từ hiện tại.
    │   2. Sinh chuỗi UUID ngẫu nhiên cho `token`.
    │   3. Lưu bản ghi lời mời vào CSDL qua Repository.
    │
    ▼ Trả về: { id, token, senderId, receiverId, status, expiresAt, createdAt }

Lỗi có thể xảy ra:
- 401 Unauthorized → Lỗi token người dùng.
```

### GET /friend-requests/info/:token

```
Client gửi: param `token`
    │
    ▼ Controller.getInviteInfo()
    │
    ▼ Service.getInviteInfo()
    │   1. Tìm bản ghi chứa token. Nếu null → 404 NotFound.
    │   2. Kiểm tra `status !== PENDING` → 400 BadRequest.
    │   3. Kiểm tra quá hạn `expiresAt`. Nếu hết hạn, cập nhật trạng thái `EXPIRED` vào CSDL và ném lỗi 400.
    │
    ▼ Trả về: Cấu trúc chi tiết của lời mời kèm relation `sender` (id, name, email).

Lỗi có thể xảy ra:
- 404 NotFoundException → Không tồn tại token.
- 400 BadRequestException → Token đã sử dụng hoặc hết hạn.
```

### POST /friend-requests/accept/:token

```
Client gửi: param `token`
    │
    ▼ Controller.acceptInvite()
    │   → Lấy id người dùng nhận lời mời từ `@Request`.
    │
    ▼ Service.acceptInvite()
    │   1. Chạy `getInviteInfo()` để xác thực tính hợp lệ của token.
    │   2. Xác minh `senderId !== receiverId` (tránh tự gửi cho bản thân). Nếu vi phạm → 400 BadRequest.
    │   3. Gọi Repository update `status = ACCEPTED` và ghi nhận `receiverId`.
    │
    ▼ Trả về: Bản ghi lời mời đã cập nhật.

Lỗi có thể xảy ra:
- 401 Unauthorized → Vấn đề về auth.
- 404/400 → Theo luồng của hàm `getInviteInfo`.
- 400 BadRequestException → Nếu người nhận chính là người gửi lời mời.
```

---

## 4. Đánh giá — Đã tốt chưa?

### ✅ Đã làm tốt

| Điểm tốt | Lý do |
|----------|-------|
| Tách Repository Layer | Lệnh truy vấn Prisma (như điều kiện tìm kiếm `OR` 2 chiều) được cô lập vào Repository, giữ nguyên sự thuần túy của Service Layer chỉ cho Business Logic. |
| Lazy Update Status | Việc cập nhật hạn lời mời (`EXPIRED`) chỉ diễn ra tự động khi có người truy vấn nó (`getInviteInfo`). Pattern này tiết kiệm tài nguyên do không cần chạy cron job quét cơ sở dữ liệu định kỳ. |
| Tính năng Invitation Mở | Cung cấp tùy chọn tạo link với `receiverId` là optional, hỗ trợ gửi lời mời đại trà qua ứng dụng khác, ai click đầu tiên sẽ trở thành `receiverId` lúc accept. |

### ❌ Chưa tốt / Cần cải thiện

**1. Bảo mật và nghiệp vụ gửi tin nhắn**
```typescript
// HIỆN TẠI — vấn đề:
// Việc gửi tin nhắn không bị ràng buộc (bất cứ ai có ID cũng gửi được cho người khác), tiềm ẩn nguy cơ spam.
async create(senderId: string, createMessageDto: CreateMessageDto): Promise<Message> {
  return this.messageRepository.create({ ... });
}

// NÊN SỬA — lý do:
// Cần tích hợp method `checkConnection` của `FriendRequestService` vào luồng gửi tin nhắn, để đảm bảo 2 người đã ACCEPTED nhau trước khi nhắn. Ném lỗi ForbiddenException(403) nếu không phải bạn bè.
```

**2. Thiếu phân trang cho API xem tin nhắn**
```typescript
// HIỆN TẠI — vấn đề:
// `findConversation` lấy toàn bộ log tin nhắn. Điều này sẽ chậm nếu cuộc trò chuyện dài.
async findConversation(userId1: string, userId2: string): Promise<Message[]> {
  return this.findMany({ ... });
}

// NÊN SỬA — lý do:
// Cần implement phân trang (Pagination), ví dụ cursor-based pagination hoặc đơn giản là skip/take để giảm tải cho DB và Network.
```

---

## 5. API Design Review

### Endpoint Naming
```
POST /messages                       [✅] Chuẩn convention RESTful tạo mới.
GET  /messages/:userId               [✅] Hợp lý, nhận dạng tài nguyên là cuộc hội thoại với một user.
POST /friend-requests/invite         [⚠️] Thiên hướng verb-oriented (invite). Có thể đơn giản hóa bằng POST /friend-requests.
GET  /friend-requests/info/:token    [⚠️] Verb-oriented. Hợp lý hơn với GET /friend-requests/:token.
POST /friend-requests/accept/:token  [⚠️] Tốt hơn là sử dụng PATCH hoặc PUT /friend-requests/:token/accept.
```

### Response Shape
```typescript
// Nhóm Endpoint của Messages trả về:
{
  id: string,          // UUID của tin nhắn
  content: string,     // Nội dung
  senderId: string,    // Người gửi
  receiverId: string,  // Người nhận
  createdAt: Date      // Thời gian tạo
}
```

### HTTP Status Codes
```
POST /messages                       → 201 Created   [✅]
GET  /messages/:userId               → 200 OK        [✅]
POST /friend-requests/invite         → 201 Created   [✅]
GET  /friend-requests/info/:token    → 200 OK        [✅]
POST /friend-requests/accept/:token  → 201 Created   [✅]
```

---

## 6. Cách Debug khi gặp lỗi

### Lỗi 400 BadRequest khi "Get Invitation Info" hoặc "Accept Invite"

```
Checklist:
1. Xem thông báo lỗi trả về.
2. Nếu là "Invite link is already X", kiểm tra lại trong database cột `status` đã thành `ACCEPTED` hay `EXPIRED` chưa. Lời mời chỉ được thao tác khi còn `PENDING`.
3. Nếu là "Invite link has expired", kiểm tra cột `expiresAt`. Hệ thống tự update thành EXPIRED nếu gọi API quá thời hạn này.
4. Nếu là "You cannot accept your own invite", đảm bảo người đăng nhập không phải chính là `senderId` trong link.

Command debug:
→ rtk grep "Invite link has expired" src/messages
→ Query DB test: SELECT id, token, status, "expiresAt" FROM "FriendRequest" WHERE token='<token>';
```

### Lỗi 401 Unauthorized

```
Checklist:
1. Kiểm tra request đã đính kèm Bearer token hợp lệ trên Header chưa.
2. Endpoint `getInviteInfo` là ngoại lệ vì nó Public (không guard).
```

---

## 7. Các Pattern quan trọng trong module này

### Pattern 1: Lazy Update (Cập nhật trễ trạng thái hết hạn)
```typescript
// Tại sao dùng pattern này?
// → Tránh overhead cho hệ thống khi không cần các tác vụ chạy nền (Cron jobs/Workers) quét DB đổi trạng thái định kỳ. Việc update chỉ xảy ra khi User truy cập tài nguyên.

if (new Date() > invite.expiresAt) {
  await this.friendRequestRepository.update({
    where: { id: invite.id },
    data: { status: RequestStatus.EXPIRED },
  });
  throw new BadRequestException('Invite link has expired');
}

// Nếu KHÔNG dùng pattern này thì sao?
// → Sẽ cần phụ thuộc vào một process background, khiến code trở nên phức tạp và khó cài đặt hơn cho một tính năng nhỏ.
```

### Pattern 2: Biến Query Params thành Prisma OR condition
```typescript
// Tại sao dùng pattern này?
// → Rất tự nhiên để quét một hội thoại 2 chiều trong CSDL.

return this.findMany({
  where: {
    OR: [
      { senderId: userId1, receiverId: userId2 },
      { senderId: userId2, receiverId: userId1 },
    ],
  },
  orderBy: { createdAt: 'asc' },
});
```

---

## 8. Biến môi trường cần thiết

```env
# Module không định nghĩa biến riêng biệt, chỉ sử dụng chung:
DATABASE_URL=          # Kết nối CSDL thông qua Prisma
JWT_SECRET=            # Cung cấp cho cơ chế Guard giải mã Token xác thực
```

---

## 9. Khi AI agent làm việc với module này

**Trước khi thêm feature mới:**
- Mọi logic tính toán, xác thực thời gian, kiểm tra role (nếu có) phải đưa vào `Service`.
- `Repository` đảm trách mọi truy vấn đến DB. Không import/sử dụng trực tiếp Prisma Client ở Controller hay Service.

**Khi sửa [phần bảo mật/chặn lời mời]:**
- Tuyệt đối không xóa logic kiểm tra điều kiện `status !== RequestStatus.PENDING`, bởi điều đó sẽ dẫn tới việc một link lời mời có thể bị lợi dụng để nhiều user bấm chấp nhận lặp đi lặp lại.
- Logic kiểm tra `new Date() > expiresAt` phải luôn đi trước việc update database.

**Khi thêm endpoint mới:**
- Luôn gắn đầy đủ các Decorator của Swagger như `@ApiTags`, `@ApiOperation`, và mô tả cho DTO.
- Luôn kiểm soát đầu ra API thông qua thư viện `class-transformer` (`plainToInstance`) và cấu trúc DTO để đảm bảo tính đồng nhất.
- Bất kì endpoint nào tác động sửa đổi dữ liệu (Messages, Accept) cần `@UseGuards(JwtAuthGuard)` và `@ApiBearerAuth()`.

**Khi debug:**
- Khi lỗi ở truy vấn tin nhắn giữa 2 cá nhân, hãy thử hoán đổi đầu vào của `senderId` và `receiverId` xem log vì Prisma OR có thể rỗng nếu kiểu dữ liệu ID (UUID) bị lệch.
- Theo vết `expiresAt` để kiểm tra các bug do chênh lệch múi giờ trên Server/DB.
