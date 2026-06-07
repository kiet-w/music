# Backend Plan: Friend Invitation System

## 1. Context & Objectives
Triển khai logic phía server để quản lý lời mời kết nối giữa các người dùng thông qua token có thời hạn 24h.

## 2. Granular Tasks
- [x] **Task 1: Cập nhật Schema Prisma**
  - **Action:** Thêm model `FriendRequest` và các quan hệ vào `backend/prisma/schema.prisma`.
  - **Verification:** Chạy `npx prisma validate`.
- [x]
  - **Action:** Chạy `npx prisma migrate dev --name add_friend_request`.
  - **Verification:** Kiểm tra bảng mới trong DB hoặc file `schema.prisma`.
- [x] **Task 3: Tạo DTOs cho FriendRequest**
  - **Action:** Tạo `CreateFriendRequestDto` và `FriendRequestResponseDto` trong `backend/src/messages/dto`.
  - **Verification:** Kiểm tra tính hợp lệ của class-validator.
- [x]
  - **Action:** Tạo `FriendRequestRepository` kế thừa `BaseRepository` trong `backend/src/messages/repositories`.
  - **Verification:** Các phương thức `create`, `findOne`, `update` hoạt động đúng.
- [x]
  - **Action:** Thêm logic tạo invite, lấy info theo token, và accept invite vào `MessagesService` (hoặc tạo service mới).
  - **Verification:** Logic kiểm tra `expiresAt` và `status` hoạt động đúng.
- [x]
  - **Action:** Tạo `FriendRequestsController` với các endpoint `POST /invite`, `GET /invite/:token`, `POST /invite/:token/accept`.
  - **Verification:** Chạy `npm run start:dev` và gọi thử API qua curl hoặc Postman.
- [x]
  - **Action:** Thêm các test case vào `backend/test/messages.e2e-spec.ts` để verify toàn bộ luồng.
  - **Verification:** Chạy `npm run test:e2e` và pass tất cả test.
