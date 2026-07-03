# Songs Documentation

## 1. Tổng quan Kiến trúc (Component Overview)
Module `songs` quản lý các bài hát trong hệ thống, đặc biệt là tính năng tạo bài hát từ liên kết YouTube (convert từ video sang audio) và quản lý lưu trữ theo Album. 
Gần đây, module này đã được cấu trúc lại hoàn toàn theo kiến trúc **CQRS** (Command Query Responsibility Segregation) thông qua package `@nestjs/cqrs`. 
Thay vì gộp toàn bộ logic vào trong Service (`song.service.ts`), kiến trúc mới chia nhỏ các luồng xử lý:
- **Controller**: Nhận request và chuyển tiếp DTO.
- **Service**: Điều phối viên (Orchestrator), chỉ có nhiệm vụ mapping dữ liệu sang Command hoặc Query.
- **Handlers**: Nơi chứa Business Logic cốt lõi (vd: `CreateSongFromYoutubeHandler`).
- **Repositories**: Chuyên trách làm việc với database (`song.repository.ts`).
- **Helpers**: Cung cấp hàm tiện ích dùng chung (xử lý link Youtube, validate Album).

## 2. Các Dependencies (Dependencies Injection)
- **`CqrsModule`**: Quản lý `CommandBus` và `QueryBus`.
- **`JobsModule`**: Cung cấp `BullMQ` queue (`conversionQueue`) để đẩy các tác vụ nặng (như tải video YouTube và convert) vào background job.
- **`AlbumsModule`**: Cung cấp `AlbumService` và `AlbumRepository` để xác thực hoặc tạo album mặc định khi lưu bài hát.
- **`PrismaService`**: Được gọi ngầm bên trong `BaseRepository` / `SongRepository` để kết nối database.
- **`nestjs-pino`**: Dùng để logging có cấu trúc (structured logging) cho toàn bộ hệ thống.

## 3. Phân tích chi tiết Controller, Service, Guard, v.v.

### 3.1. Controller (`song.controller.ts`)
- **Decorators**: `@Controller('songs')`, `@UseGuards(JwtAuthGuard)`, `@UseInterceptors(ClassSerializerInterceptor)`, các decorator Swagger (`@ApiTags`, v.v.).
- **Vai trò**: Lớp ngoài cùng giao tiếp với Client.
- **Methods**:
  - `createFromYoutube`: `POST /youtube`. Có gắn thêm `@UseGuards(ThrottlerGuard)` để giới hạn rate-limit chống spam tạo quá nhiều video. Gọi sang `songService.createFromYoutube`.
  - `findAll`: `GET /`. Hỗ trợ phân trang và sort thông qua `PaginationDto`. Lấy `userId` qua decorator `@CurrentUser()`.
  - `findOne`: `GET /:id`. Lấy chi tiết bài hát.
  - `remove`: `DELETE /:id`. Xóa bài hát. Trả về status 204.
  - `moveToAlbum`: `PATCH /:id/move`. Đổi album cho bài hát bằng `MoveSongDto`.

### 3.2. Service (`song.service.ts`)
- **Vai trò**: Chỉ đóng vai trò Router/Orchestrator.
- **Dependencies**: `CommandBus` và `QueryBus`.
- **Methods**:
  - `createFromYoutube`: Tạo `CreateSongFromYoutubeCommand` và `this.commandBus.execute()`.
  - `findAll`: Tạo `FindAllSongsQuery` và `this.queryBus.execute()`.
  - `findOne`: Tạo `FindOneSongQuery` và `this.queryBus.execute()`.
  - `remove`: Tạo `RemoveSongCommand` và `this.commandBus.execute()`.
  - `moveToAlbum`: Tạo `MoveSongToAlbumCommand` và `this.commandBus.execute()`.

### 3.3. Handlers (Core Business Logic)
- **`CreateSongFromYoutubeHandler`**: 
  1. Gọi `AlbumValidationHelper` kiểm tra/lấy `albumId`.
  2. Dùng `YoutubeSongHelper` tách YouTube ID.
  3. Kiểm tra xem bài này đã ai tạo chưa (`songRepository.findByYoutubeId`). Nếu có, lấy chung link âm thanh (`url`) để đỡ tốn dung lượng lưu trữ (Tái sử dụng).
  4. Nếu chưa có, tạo bản ghi bài hát trạng thái "Pending" (chưa có URL).
  5. Đưa job vào `conversionQueue` (BullMQ) để xử lý.
  6. Dùng `YoutubeSongHelper` để format DTO trả về.
- **`RemoveSongHandler`**: Kiểm tra quyền sở hữu bằng `findByUserAndId`. Xóa bằng `delete`.
- **`MoveSongToAlbumHandler`**: Kiểm tra bài hát, validate Album đích, cập nhật `albumId`.
- **`FindAllSongsHandler`**: Lấy `page`, `limit`, tính toán offset (`skip`). Chạy song song 2 Promise (`countByUser` và `findAllByUser`) để tối ưu hiệu năng.
- **`FindOneSongHandler`**: Tìm bằng `findByUserAndId`. Quăng lỗi nếu không có hoặc sai user.

### 3.4. Helpers
- **`YoutubeSongHelper`**: Chứa regex `extractYoutubeId`. Có các hàm map Object từ Prisma sang DTO (`mapToResponse` và `mapToResponseArray`).
- **`AlbumValidationHelper`**: Xử lý logic check Album. Nếu client truyền `albumId`, check quyền. Nếu không truyền, gọi `AlbumService` để tạo/trả về Album mặc định (`Default Album`) của user.

### 3.5. Repository (`song.repository.ts`)
Kế thừa `BaseRepository`.
- `findByYoutubeId`: Tìm bản ghi đã tồn tại từ link YT.
- `findByUserAndId`: Tìm theo cả `id` và `userId` (Bảo mật).
- `findAllByUser`, `countByUser`: Dùng cho Pagination.
