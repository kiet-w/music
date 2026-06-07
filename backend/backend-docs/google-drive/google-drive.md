# Google Drive Module Documentation

## 1. Tổng quan Kiến trúc (Component Overview)
Module `GoogleDrive` chịu trách nhiệm xử lý các nghiệp vụ liên quan đến việc kết nối và thao tác với Google Drive của người dùng. Bao gồm: cung cấp URL xác thực OAuth2, trao đổi mã code lấy token, kiểm tra trạng thái kết nối, liệt kê danh sách file nhạc (.mp3) trong Drive, và import (tải về) file từ Google Drive vào hệ thống lưu trữ của ứng dụng. Module này cũng cho phép tạo hoặc liên kết với Album khi import bài hát.

## 2. Các Dependencies (Dependencies Injection)
- **`PrismaService`**: Được inject qua PrismaModule, cung cấp instance Prisma Client để tương tác Database (bảng User).
- **`CACHE_MANAGER` (`Cache`)**: Cung cấp bộ nhớ đệm (cache) để lưu trữ trạng thái OAuth (state parameter) chống tấn công CSRF, và cache trạng thái kết nối (connected) của Google Drive.
- **`StorageService`**: Dịch vụ xử lý tải và lưu file vật lý/cloud (trong storage module). Dùng để upload file nhạc tải từ Google Drive lên storage nội bộ.
- **`SongRepository`**: Giao tiếp với database lưu thông tin bảng Song (bài hát) sau khi import thành công.
- **`AlbumService`**: Xử lý logic tìm hoặc tạo album mặc định khi import bài hát.
- **`AlbumRepository`**: Truy vấn database để tìm kiếm album khi import.
- **`PinoLogger` (nestjs-pino)**: (Trong controller) Dùng để ghi log.

## 3. Phân tích chi tiết Controller & Service
### 3.1. GoogleDriveController (`google-drive.controller.ts`)
Các Decorators:
- `@ApiTags('google-drive')`, `@Controller('google-drive')`: Swagger tag và prefix route `/google-drive`.
- `@ApiBearerAuth()`: Yêu cầu token xác thực Bearer trên Swagger.
- `@UseGuards(JwtAuthGuard)`: Yêu cầu Request có JWT hợp lệ.
- `@Get`, `@Post`: HTTP Methods.
- `@ApiOperation`: Sinh tài liệu Swagger.
- `@CurrentUser()`: Custom decorator lấy user từ token.

**Các endpoint (Public Methods):**
- **`ping()`**: GET `/google-drive/ping`. Trả về trạng thái, thời gian, version.
- **`getStatus(user)`**: GET `/google-drive/status`. Trả về `{ connected: boolean }`. Dùng cache với key `gdrive-status-${user.id}` (TTL: 5 phút). Nếu chưa có cache, gọi `googleDriveService.isConnected()`.
- **`getAuthUrl(user)`**: GET `/google-drive/auth-url`. Gọi `googleDriveService.generateAuthUrl()` lấy URL OAuth2 của Google.
- **`exchangeCode(user, dto)`**: POST `/google-drive/exchange-code`. Nhận `code` và `state` từ `ExchangeCodeDto`. Gọi `googleDriveService.exchangeCodeForTokens()` để lấy refresh/access token.
- **`listFiles(user)`**: GET `/google-drive/files`. Gọi `googleDriveService.listFiles()` để liệt kê các file âm thanh.
- **`importFile(user, importDto)`**: POST `/google-drive/import`. Nhận `ImportDto` (fileId, albumId, fileName, driveToken). Gọi `googleDriveService.importFile()` để tải file và lưu vào hệ thống.

### 3.2. MusicController (`music.controller.ts`)
Các Decorators:
- `@ApiTags('music')`, `@Controller('music')`: Prefix route `/music`.
- `@ApiBearerAuth()`, `@UseGuards(JwtAuthGuard)`: Yêu cầu JWT.
- `@Post('import')`, `@ApiOperation()`: Endpoint import.

**Các endpoint (Public Methods):**
- **`importFile(user, importDto)`**: Tương tự hàm `importFile` trong `GoogleDriveController`, nhận yêu cầu import file và chuyển hướng sang `googleDriveService.importFile()`. 

### 3.3. GoogleDriveService (`google-drive.service.ts`)
#### Các Public Methods:
- **`constructor()`**: Khởi tạo `google.auth.OAuth2` client bằng credentials trong `process.env`.
- **`generateAuthUrl(userId: string)`**: Sinh UUID cho `state`, lưu `state` và `userId` vào `cacheManager` với thời hạn 5 phút. Sau đó gọi `oauth2Client.generateAuthUrl()` yêu cầu quyền `drive.readonly` và `offline` access (để có refresh token).
- **`isConnected(userId: string)`**: Truy vấn `User` qua `PrismaService` để kiểm tra trường `googleRefreshToken` có tồn tại không.
- **`exchangeCodeForTokens(userId: string, code: string, state: string)`**: Lấy `userId` từ cache bằng key `state`. Nếu không khớp, ném `UnauthorizedException`. Gọi `oauth2Client.getToken()` để lấy token. Sau đó update `googleAccessToken`, `googleRefreshToken`, và `googleTokenExpiry` của User vào DB. Xoá `state` khỏi cache.
- **`importFile(userId: string, importDto: ImportDto)`**:
  - Resolve Album ID qua `resolveAlbumId()`.
  - Lấy Metadata của file từ Google Drive (`getFileMetadata()`) và validate chuẩn file mp3 (`validateMp3()`).
  - Tải file từ Drive dạng stream (`downloadFile()`).
  - Sanitize tên file (`sanitizeFileName()`), tạo đường dẫn thư mục lưu file và upload lên Storage nội bộ (`storageService.uploadStream()`).
  - Tạo record `Song` qua `songRepository.create()`.
- **`listFiles(userId: string)`**: Gọi `setCredentials()` xác thực, lấy Drive instance. Request `drive.files.list()` tìm các file không trash, thuộc loại `audio/mpeg` hoặc là file `shortcut`. Sau đó có logic lọc khắt khe hơn: kiểm tra mp3 mime, mp3 ext hoặc là mp3 shortcut. Return các file đã lọc và map targetId cho shortcut.
- **`getFileMetadata(userId: string, fileId: string, accessToken?: string)`**: Thiết lập credentials từ accessToken (nếu cung cấp) hoặc gọi `setCredentials()`. Gọi `drive.files.get()` lấy metadata (id, name, mimeType, size).
- **`downloadFile(userId: string, fileId: string, accessToken?: string)`**: Tương tự, thiết lập credentials và gọi `drive.files.get()` với `alt: 'media'` và `responseType: 'stream'` để nhận file stream.

#### Các Private Methods (Helpers):
- **`resolveAlbumId(userId: string, albumId?: string)`**: Kiểm tra nếu client gửi `albumId`, tìm album đó bằng `albumRepository` xem thuộc về user không (nếu không -> `NotFoundException`). Nếu không có `albumId`, lấy default album qua `albumService.findOrCreateDefault()`.
- **`validateMp3(metadata: any, fileName?: string)`**: Kiểm tra mimeType hoặc tên file có chứa định dạng mp3 không. Nếu không, ném `BadRequestException`.
- **`sanitizeFileName(name: string)`**: Bỏ các ký tự unicode dấu tiếng Việt và thay ký tự đặc biệt bằng dấu `_`.
- **`setCredentials(userId: string)`**: Tìm `User` trong DB, lấy refreshToken và accessToken. Nếu không có refreshToken, báo lỗi `UnauthorizedException`. Thiết lập token vào `oauth2Client`. Ngoài ra gán sự kiện `on('tokens')` để lưu DB khi Google tự động refresh tokens.
