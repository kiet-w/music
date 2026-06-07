# Albums Module Documentation

## 1. Tổng quan Kiến trúc (Component Overview)
Module `Albums` chịu trách nhiệm quản lý các album nhạc của người dùng trong hệ thống. Bao gồm các tính năng: tạo album mới, lấy danh sách album của người dùng (có phân trang), lấy chi tiết một album theo ID, và tìm hoặc tạo một album mặc định (Default album) cho người dùng.

## 2. Các Dependencies (Dependencies Injection)
- **`AlbumRepository`**: Đóng gói các hàm truy vấn database liên quan tới entity `Album`, được inject vào `AlbumService` thông qua `AlbumsModule`.
- **`PinoLogger` (nestjs-pino)**: Dùng để ghi log các sự kiện trong quá trình thao tác với album (create, find, error).
- **`PrismaService`**: Được inject trong `AlbumRepository` (qua `BaseRepository`) để cung cấp Prisma Client truy vấn DB.

## 3. Phân tích chi tiết Controller, Service, Guard, v.v.

### 3.1. AlbumController (`album.controller.ts`)
Các Decorators:
- `@ApiTags('albums')`, `@Controller('albums')`: Gắn Swagger tag và prefix route là `/albums`.
- `@ApiBearerAuth()`: Chỉ định yêu cầu Bearer token trên Swagger UI.
- `@UseGuards(JwtAuthGuard)`: Yêu cầu Request phải đính kèm JWT Token hợp lệ để vượt qua Guard.
- `@UseInterceptors(ClassSerializerInterceptor)`: Sử dụng interceptor để tự động format dữ liệu trả về theo DTO.
- `@Post()`, `@Get()`: Định nghĩa HTTP method.
- `@ApiOperation`, `@ApiResponse`: Sinh tài liệu Swagger.
- `@Body()`, `@Query()`, `@Param()`, `@CurrentUser()`: Extract tham số tương ứng từ HTTP Request.

**Các endpoint (Public Methods):**
- **`create(user: any, createAlbumDto: CreateAlbumDto)`**: 
  - Logic: Nhận data từ body (title, artist, coverUrl) và user từ token -> gọi `AlbumService.create()`.
  - Return: Trả về `AlbumResponseDto`.
- **`findAll(user: any, page?: string, limit?: string)`**:
  - Logic: Lấy tất cả album của user với phân trang -> Tính toán tham số `skip` và `take` từ `page` và `limit` (mặc định limit 50) rồi gọi `AlbumService.findAll()`.
  - Return: Danh sách album, tổng số, trang hiện tại, limit và tổng số trang.
- **`findOne(user: any, id: string)`**:
  - Logic: Lấy chi tiết một album. Gọi `AlbumService.findOne()`. Nếu kết quả trả về null, ném ra `NotFoundException`.
  - Return: `AlbumResponseDto`.

### 3.2. AlbumService (`album.service.ts`)
#### Các Public Methods:
- **`create(userId: string, data: CreateAlbumDto)`**:
  - Tham số: `userId`, `data` (title, artist, coverUrl).
  - Logic: Ghi log sự kiện. Gọi `albumRepository.create` để tạo album mới với `userId`.
  - Return: Kết quả qua hàm helper `mapAlbumResponse()`.
- **`findOrCreateDefault(userId: string)`**:
  - Tham số: `userId`.
  - Logic: Gọi `albumRepository.findDefault(userId)`. Nếu có, format qua `mapAlbumResponse` và trả về. Nếu chưa có, tiến hành tạo một album với `title: 'Default'`, `artist: 'Various Artists'`, `isDefault: true`. Khối `try-catch` bắt lỗi race condition, nếu có process khác vừa tạo thì catch lấy lỗi đó, chạy lại `findDefault(userId)` để lấy record và trả về. Ném lỗi nếu thất bại toàn bộ.
  - Return: Album mặc định qua `mapAlbumResponse()`.
- **`findAll(userId: string, skip: number = 0, take: number = 50)`**:
  - Tham số: `userId`, `skip`, `take`.
  - Logic: Ghi log sự kiện. Gọi đồng thời `albumRepository.count()` và `albumRepository.findMany()` qua `Promise.all` để tối ưu (có order by `createdAt` desc và include đếm số tracks).
  - Return: Object chứa mảng `data` (đã map qua `mapAlbumResponse()`), `total`, `page`, `limit`, `totalPages`.
- **`findOne(userId: string, id: string)`**:
  - Tham số: `userId`, `id`.
  - Logic: Ghi log sự kiện. Gọi `albumRepository.findFirst()` theo `id` và `userId` (kèm _count tracks).
  - Return: `mapAlbumResponse()`.

#### Các Private Methods (Helpers):
- **`mapAlbumResponse(album: any)`**: Nhận vào một object album thô. Nếu null thì trả về null. Format lại object: ánh xạ trường `_count.tracks` từ Prisma sang `_count.songs` để phù hợp với `AlbumResponseDto`.

### 3.3. AlbumRepository (`album.repository.ts`)
Các hàm Public:
- Kế thừa `BaseRepository` của ứng dụng (`BaseRepository<Album, Prisma.AlbumDelegate<any>>`).
- **`findByUserAndTitle(userId: string, title: string)`**: Truy vấn `.findFirst` dựa theo trường `userId` và `title`.
- **`findDefault(userId: string)`**: Truy vấn `.findFirst` dựa theo `userId` và `isDefault: true`.
- **`findByTitleAndArtist(title: string, artist: string)`**: Truy vấn `.findFirst` dựa theo `title` và `artist`.

### 3.4. DTOs (Data Transfer Objects)
- **`CreateAlbumDto`**: Kiểm tra validate với các decorators của `class-validator` như `@IsString()`, `@IsNotEmpty()`, `@IsUrl()`, `@IsOptional()` cho các trường.
- **`AlbumResponseDto`**: Sử dụng `@Expose()` và `@Type()` (của `class-transformer`) để map và chỉ định các properties sẽ được xuất ra trong API response, đồng thời support Swagger docs.
