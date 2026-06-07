# Admin Module Documentation

## 1. Tổng quan Kiến trúc (Component Overview)
Module `Admin` chịu trách nhiệm xử lý các nghiệp vụ quản trị hệ thống, cụ thể là cung cấp các API để xóa bài hát (track) và dọn dẹp các tệp tin trong hệ thống lưu trữ (storage).

## 2. Các Dependencies (Dependencies Injection)
- **`SongsModule`**: Được import vào `AdminModule` để chia sẻ các provider liên quan đến thực thể `Song` (bao gồm `SongRepository`).
- **`StorageModule`**: Được import vào `AdminModule` để chia sẻ các provider xử lý về lưu trữ tệp (bao gồm `StorageCleanupService`).
- **`SongRepository`**: Giao tiếp với cơ sở dữ liệu để thực hiện câu truy vấn xóa bài hát.
- **`StorageCleanupService`**: Xử lý logic xóa file thực tế trên các bucket lưu trữ.

## 3. Phân tích chi tiết Controller & Service
### 3.1. AdminController (`admin.controller.ts`)
Các Decorators:
- `@Controller('admin')`: Định nghĩa prefix cho toàn bộ các route trong controller này là `/admin`.
- `@Delete('tracks/:id')`, `@Post('storage/cleanup')`: Định nghĩa HTTP method (DELETE, POST) và đường dẫn endpoint tương ứng.
- `@HttpCode(HttpStatus.OK)`: Đổi HTTP Status code trả về thành 200 OK (thay vì 201 mặc định cho method POST) đối với endpoint `cleanupStorage`.
- `@Param('id')`: Trích xuất tham số `id` từ URL params.
- `@Body()`: Trích xuất phần thân (payload) của HTTP Request và parse theo DTO tương ứng.
- `@IsString()`, `@IsNotEmpty()`: Các decorators của `class-validator` dùng trong `CleanupStorageDto` để bắt buộc tham số phải là chuỗi và không được để trống.

**Các endpoint (Public Methods):**
- **`deleteTrack(id: string)`**: Nhận tham số `id` từ URL -> gọi `adminService.deleteTrack(id)`.
- **`cleanupStorage(cleanupDto: CleanupStorageDto)`**: Nhận data từ body (chứa `bucketName` và `path`) -> gọi `adminService.cleanupStorage(cleanupDto)`.

**DTOs:**
- **`CleanupStorageDto`**: Lớp chứa `bucketName` và `path`. Dùng để hứng và validate dữ liệu từ request body.

### 3.2. AdminService (`admin.service.ts`)
Các Decorators:
- `@Injectable()`: Đánh dấu class `AdminService` là một provider có thể được inject vào các class khác.

#### Các Public Methods:
- **`deleteTrack(id: string)`**:
  - Tham số: `id` (chuỗi định danh của bài hát).
  - Logic: Trực tiếp gọi `this.songRepository.delete({ where: { id } })` để xóa record trong DB.
  - Return: Kết quả từ tầng repository (thường là bản ghi vừa bị xóa).
- **`cleanupStorage(dto: CleanupStorageDto)`**:
  - Tham số: `dto` (dữ liệu truyền từ Controller).
  - Logic: Dùng `await this.storageCleanupService.cleanupFile(dto.bucketName, dto.path)` để yêu cầu dịch vụ lưu trữ xóa tệp trên bucket tương ứng.
  - Return: Object kết quả `{ message: 'Storage cleanup initiated', file: dto.path }`.

### 3.3. AdminModule (`admin.module.ts`)
Các Decorators:
- `@Module()`: Khai báo module trong hệ sinh thái NestJS. Đăng ký `Imports` (`SongsModule`, `StorageModule`), `Controllers` (`AdminController`), và `Providers` (`AdminService`).
