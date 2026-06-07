# Integration Plan: Friend Invitation System

## 1. Context & Objectives
Đảm bảo sự đồng bộ về dữ liệu và luồng hoạt động giữa Backend và Frontend cho tính năng lời mời.

## 2. Granular Tasks
- [x]
  - **Action:** Xác định format của `FriendRequestResponseDto` để Frontend map đúng các field `senderName`, `senderId`.
  - **Verification:** Kiểm tra file DTO (Backend) và API client (Frontend).
- [x]
  - **Action:** Tạo link từ Backend và dán vào trình duyệt để Frontend xử lý.
  - **Verification:** Frontend nhận được token và fetch được dữ liệu từ Backend.
- [x]
  - **Action:** Sau khi người B nhấn Accept, kiểm tra xem người A có nhận được thông báo hoặc thấy người B trong danh sách không.
  - **Verification:** Danh sách chat cập nhật mà không cần reload trang.
- [x]
  - **Action:** Thực hiện kịch bản: A tạo link -> B click link -> B chấp nhận -> A & B nhắn tin.
  - **Verification:** Toàn bộ luồng hoạt động mượt mà không lỗi.
