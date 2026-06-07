# Spec: Hệ thống Lời mời và Chấp nhận Hội thoại (Friend Invitation System)

- **Ngày tạo:** 2026-06-05
- **Trạng thái:** Chờ duyệt
- **Mục tiêu:** Cho phép người dùng kết nối với nhau qua link mời có thời hạn (1 ngày), hiển thị popup xác nhận và mở khóa tính năng nhắn tin.

## 1. Yêu cầu Hệ thống
- Người dùng có thể tạo link mời chia sẻ ra bên ngoài.
- Link mời có hiệu lực trong 24 giờ.
- Người nhận click link sẽ mở ứng dụng, hiện popup xác nhận thông tin người mời.
- Sau khi chấp nhận, hai người có thể nhắn tin cho nhau.

## 2. Thiết kế Cơ sở dữ liệu (Prisma)
Bổ sung model `FriendRequest` để quản lý trạng thái kết nối giữa các `User`.

```prisma
model FriendRequest {
  id         String   @id @default(uuid())
  senderId   String
  receiverId String?  // Null cho link public
  status     String   @default("PENDING") // PENDING, ACCEPTED, REJECTED
  token      String   @unique @default(uuid())
  createdAt  DateTime @default(now())
  expiresAt  DateTime

  sender     User     @relation("SentRequests", fields: [senderId], references: [id], onDelete: Cascade)
  receiver   User?    @relation("ReceivedRequests", fields: [receiverId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([senderId])
  @@index([receiverId])
}
```

## 3. Danh sách API (Backend)

### 3.1. Tạo Lời mời
- **Endpoint:** `POST /messages/invite`
- **Auth:** Yêu cầu JWT.
- **Xử lý:** 
    - Tạo `FriendRequest` với `expiresAt` = hiện tại + 24h.
    - Trả về `token`.

### 3.2. Lấy thông tin Lời mời
- **Endpoint:** `GET /messages/invite/:token`
- **Xử lý:**
    - Tìm bản ghi theo `token`.
    - Kiểm tra thời hạn và trạng thái.
    - Trả về thông tin `sender` (Tên, Email).

### 3.3. Chấp nhận Lời mời
- **Endpoint:** `POST /messages/invite/:token/accept`
- **Auth:** Yêu cầu JWT.
- **Xử lý:**
    - Cập nhật `receiverId` là người đang đăng nhập.
    - Chuyển `status` thành `ACCEPTED`.

## 4. Giao diện người dùng (Frontend)

### 4.1. Trang trung gian (Invite Page)
- Đường dẫn: `/[locale]/invite?token=...`
- Logic: 
    - Fetch API lấy thông tin người mời.
    - Hiện Popup xác nhận với nút "Chấp nhận" và "Để sau".
    - Xử lý các trạng thái: Link hết hạn, Link không hợp lệ, Đã là bạn.

### 4.2. Tích hợp Message
- Tại `ChatWindow`, nếu chưa có `FriendRequest` được chấp nhận, hiển thị banner thông báo hoặc chặn gửi tin nhắn (tùy thuộc vào yêu cầu bảo mật sau này).

## 5. Kế hoạch triển khai (Giai đoạn tiếp theo)
1. Cập nhật `schema.prisma` và chạy migration.
2. Triển khai API Backend trong module `messages`.
3. Tạo trang `invite` và component Popup tại Frontend.
4. Kiểm thử luồng E2E.
