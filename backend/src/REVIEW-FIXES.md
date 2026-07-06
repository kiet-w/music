# Báo Cáo Sửa Lỗi Code Review

**Ngày:** 2026-07-07  
**Phạm vi:** `backend/src/`  
**Người thực hiện:** MiMo Code Agent (Subagent-Driven Development)

---

## Tóm Tắt

Đã sửa tổng cộng **14 lỗi** (5 Critical, 9 Important) được phát hiện trong quá trình code review.

---

## Các Lỗi Critical Đã Sửa

### C2. Rò rỉ Event Listener trong OAuth2
- **File:** `google-drive/google-drive.service.ts`
- **Vấn đề:** Mỗi lần gọi `setCredentials()` đăng ký một listener mới trên cùng một instance `oauth2Client`, gây rò rỉ bộ nhớ và ghi database trùng lặp.
- **Sửa:** Thêm `this.oauth2Client.removeAllListeners('tokens')` trước khi đăng ký listener mới.

### C3. Lỗi lộ thông tin nội bộ trong Auth
- **File:** `auth/auth.service.ts`
- **Vấn đề:** `error.message` được trả về cho client, có thể lộ stack trace hoặc thông tin OAuth nội bộ.
- **Sửa:** Chỉ log lỗi chi tiết, trả về thông báo chung chung cho client.

### C4. Lỗi lộ thông tin nội bộ trong Exception Filter
- **File:** `common/filters/all-exceptions.filter.ts`
- **Vấn đề:** Lỗi 5xx trả về `exception.message` cho client, có thể lộ schema database hoặc đường dẫn nội bộ.
- **Sửa:** Trong môi trường production, chỉ trả về "Internal server error" cho lỗi 5xx.

### C5. Quét `/tmp` toàn hệ thống
- **File:** `jobs/cleanup.service.ts`
- **Vấn đề:** Xóa file `.mp3` và `.part` từ `/tmp` có thể ảnh hưởng đến các process khác.
- **Sửa:** Chỉ quét thư mục temp của ứng dụng (`process.cwd()/temp`).

---

## Các Lỗi Important Đã Sửa

### I1. Thiếu kiểu dữ liệu cho `@CurrentUser()`
- **File:** Tất cả controllers (7 files, 20 chỗ)
- **Vấn đề:** Sử dụng `any` thay vì kiểu dữ liệu cụ thể.
- **Sửa:** Tạo interface `AuthenticatedUser` và sử dụng thống nhất.

### I2. Tạo OAuth2Client mới mỗi lần gọi
- **File:** `auth/auth.service.ts`
- **Vấn đề:** `googleUnifiedLogin` tạo `OAuth2Client` mới mỗi lần gọi.
- **Sửa:** Sử dụng lại `this.googleClient` từ constructor.

### I3. Không xác thực trường `sort`
- **File:** `common/dto/pagination.dto.ts`
- **Vấn đề:** Cho phép sắp xếp theo bất kỳ tên cột nào.
- **Sửa:** Thêm `@IsIn(['title', 'artist', 'createdAt'])`.

### I4. Sử dụng đường dẫn tương đối cho yt-dlp
- **File:** `downloader/services/downloader.service.ts`
- **Vấn đề:** `./yt-dlp` và `./cookies.txt` phụ thuộc vào thư mục làm việc hiện tại.
- **Sửa:** Sử dụng `path.resolve()` để tạo đường dẫn tuyệt đối.

### I5. Thiếu import PrismaModule
- **File:** `albums/albums.module.ts`
- **Vấn đề:** Không import `PrismaModule` rõ ràng.
- **Sửa:** Thêm `imports: [PrismaModule]`.

### I6. eslint-disable toàn file
- **File:** `downloader/services/downloader.service.ts`
- **Vấn đề:** `/* eslint-disable @typescript-eslint/no-unsafe-member-access */` che giấu lỗi type safety.
- **Sửa:** Xóa blanket disable, thêm inline comment cho từng dòng cụ thể.

### I7. Try-catch rỗng
- **File:** `google-drive/google-drive.service.ts`
- **Vấn đề:** `catch (error: any) { throw error; }` là code chết.
- **Sửa:** Xóa try-catch hoàn toàn.

### I8. Thiếu rate limiting cho import endpoint
- **File:** `google-drive/google-drive.controller.ts`
- **Vấn đề:** Endpoint `POST /google-drive/import` không có `ThrottlerGuard`.
- **Sửa:** Thêm `@UseGuards(ThrottlerGuard)`.

### I9. Guard áp dụng per-method thay vì class-level
- **File:** `messages/controllers/friend-requests.controller.ts`
- **Vấn đề:** Nếu thêm method mới mà quên guard, endpoint sẽ bị lộ.
- **Sửa:** Áp dụng `@UseGuards(JwtAuthGuard)` ở class level, tạo decorator `@Public()` cho endpoint công khai.

### I10. Service trả về null thay vì throw
- **File:** `albums/album.service.ts`
- **Vấn đề:** `findOne` trả về null, controller phải kiểm tra.
- **Sửa:** Service throw `NotFoundException`, controller giữ đơn giản.

---

## File Đã Tạo Mới

1. `backend/src/auth/interfaces/authenticated-user.interface.ts` - Interface `AuthenticatedUser`
2. `backend/src/auth/public.decorator.ts` - Decorator `@Public()`

## File Đã Sửa

1. `backend/src/google-drive/google-drive.service.ts`
2. `backend/src/auth/auth.service.ts`
3. `backend/src/common/filters/all-exceptions.filter.ts`
4. `backend/src/jobs/cleanup.service.ts`
5. `backend/src/songs/songs.controller.ts`
6. `backend/src/google-drive/google-drive.controller.ts`
7. `backend/src/google-drive/music.controller.ts`
8. `backend/src/messages/controllers/messages.controller.ts`
9. `backend/src/albums/album.controller.ts`
10. `backend/src/admin/controllers/admin.controller.ts`
11. `backend/src/auth/auth.controller.ts`
12. `backend/src/common/dto/pagination.dto.ts`
13. `backend/src/downloader/services/downloader.service.ts`
14. `backend/src/albums/albums.module.ts`
15. `backend/src/albums/album.service.ts`
16. `backend/src/messages/controllers/friend-requests.controller.ts`
17. `backend/src/auth/jwt-auth.guard.ts`

---

## Ghi Chú

- **C1 (DI token mismatch)** là false positive - `StorageModule` đã đăng ký token `'IStorageProvider'` đúng cách.
- Tất cả các sửa đổi đều tập trung và tối thiểu, không thêm tính năng mới hay refactor không cần thiết.
