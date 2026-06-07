# Songs Module Documentation

## 1. Tổng quan Kiến trúc (Component Overview)
Module `Songs` chịu trách nhiệm quản lý các bài hát (Track) trong hệ thống. Tính năng cốt lõi của module bao gồm: thêm bài hát mới từ nguồn YouTube, lấy danh sách tất cả bài hát của một người dùng (hỗ trợ phân trang), lấy chi tiết bài hát, xóa bài hát, và di chuyển bài hát giữa các Album. Module này có sự kết nối chặt chẽ với `AlbumsModule` để xác thực quyền sở hữu album và `JobsModule` (sử dụng BullMQ) để đẩy tác vụ xử lý/tải âm thanh xuống chạy ngầm (Background Job).

## 2. Các Dependencies (Dependencies Injection)
- **`JobsModule`**: Cung cấp hàng đợi `conversion` thông qua `BullMQ` để xử lý việc convert video từ YouTube sang audio một cách bất đồng bộ.
- **`AlbumsModule`**: Import để sử dụng `AlbumService` và `AlbumRepository` giúp xác thực quyền truy cập album của người dùng, cũng như lấy/tạo album mặc định khi không chỉ định album cụ thể.
- **`SongRepository`**: Tầng giao tiếp với database (Prisma) cho entity `Track`.
- **`PinoLogger` (nestjs-pino)**: Dùng để ghi log (thông tin, cảnh báo, debug) trong quá trình xử lý logic của `SongService`.

## 3. Phân tích chi tiết Controller & Service
### 3.1. SongController (`song.controller.ts`)
Các Decorators:
- `@ApiTags('songs')`, `@Controller('songs')`: Gắn Swagger tag và định nghĩa prefix API là `/songs`.
- `@ApiBearerAuth()`, `@UseGuards(JwtAuthGuard)`: Yêu cầu Request phải có JWT token hợp lệ.
- `@UseInterceptors(ClassSerializerInterceptor)`: Tự động format response thông qua `class-transformer` (loại bỏ các thuộc tính không expose).
- Định nghĩa HTTP methods: `@Post`, `@Get`, `@Delete`, `@Patch`.

**Các endpoint (Public Methods):**
- **`createFromYoutube(user, createSongDto: CreateSongYoutubeDto)`**: Nhận url và thông tin bài hát từ body -> gọi `SongService.createFromYoutube()`.
- **`findAll(user, page, limit)`**: Nhận tham số phân trang qua Query, tính toán `skip` và `take` thủ công -> gọi `SongService.findAll()`.
- **`findOne(user, id)`**: Nhận tham số `id` trên path -> gọi `SongService.findOne()`.
- **`remove(user, id)`**: Xóa bài hát theo `id`. Sử dụng `@HttpCode(204)` trả về No Content khi thành công -> gọi `SongService.remove()`.
- **`moveToAlbum(user, id, albumId)`**: Chuyển bài hát sang album khác với `albumId` ở body -> gọi `SongService.moveToAlbum()`.

### 3.2. SongService (`song.service.ts`)
#### Các Public Methods:
- **`createFromYoutube(userId, url, title, artist, albumId)`**:
  - Logic: Ghi log bắt đầu. Gọi `getValidatedAlbumId()` để kiểm tra hoặc lấy album mặc định. Lưu record mới vào DB (có `url` tạm để trống và `sourceType: 'youtube'`). Đẩy job tên là `convert` vào hàng đợi `conversionQueue` (truyền `url`, `songId`, `userId`) để xử lý ngầm. 
  - Return: Thông tin bài hát dưới dạng DTO qua `mapToResponse()`.
- **`findAll(userId, skip, take)`**:
  - Logic: Tạo điều kiện `where` truy vấn theo `userId` từ liên kết album. Gọi đồng thời (qua `Promise.all`) `count()` và `findMany()` từ `songRepository` để lấy tổng số bản ghi và dữ liệu phân trang.
  - Return: Object chứa mảng DTO bài hát, `total`, `page`, `limit`, và `totalPages`.
- **`findOne(userId, id)`**:
  - Logic: Gọi hàm helper `findAndValidateSong()` để lấy bài hát và xác nhận quyền của người dùng hiện tại đối với bài hát đó.
  - Return: DTO cấu trúc bài hát.
- **`remove(userId, id)`**:
  - Logic: Gọi `findAndValidateSong()` để đảm bảo bài hát tồn tại và người dùng có quyền. Gọi `songRepository.delete()` xóa khỏi DB.
- **`moveToAlbum(userId, id, albumId)`**:
  - Logic: Gọi `findAndValidateSong()` check bài hát hiện tại. Gọi `getValidatedAlbumId()` xác nhận album đích có tồn tại và thuộc về user không. Cập nhật record với `songRepository.update()`.
  - Return: DTO bài hát đã cập nhật.

#### Các Private Methods (Helpers):
- **`getValidatedAlbumId(userId, albumId)`**: Nếu có `albumId`, truy vấn `albumRepository` xem nó có tồn tại và thuộc về `userId` không (ném lỗi NotFound nếu sai). Nếu không có `albumId`, gọi `albumService.findOrCreateDefault(userId)` để lấy ID album mặc định.
- **`findAndValidateSong(userId, id)`**: Tìm bản ghi bài hát dựa vào `id` kết hợp check `album.userId === userId`. Nếu không tồn tại, ném ra `NotFoundException('Song not found')`.
- **`mapToResponse(song)`**: Chuyển đổi dữ liệu raw query sang `SongResponseDto` bằng `plainToInstance` (loại bỏ các key dư thừa).
- **`mapToResponseArray(songs)`**: Chuyển đổi mảng dữ liệu raw.

### 3.3. SongRepository (`song.repository.ts`)
Các hàm Public:
- Kế thừa `BaseRepository<Track, Prisma.TrackDelegate<any>>` để tái sử dụng lại các hàm ORM chuẩn như `count`, `findMany`, `findFirst`, `findUnique`, `update`, `create`, `delete` mà Prisma cung cấp. Sử dụng bảng `Track`.
