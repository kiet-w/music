# Kiến trúc CQRS trong Songs Module

Tài liệu này giải thích chi tiết luồng xử lý (flow) của `SongsModule` sau khi được refactor sang mô hình **CQRS** (Command Query Responsibility Segregation).

---

## 1. CQRS là gì?

CQRS là một pattern chia việc xử lý dữ liệu ra làm 2 phần riêng biệt:
- **Command (Ghi)**: Các thao tác thay đổi dữ liệu (Create, Update, Delete). Ví dụ: Tạo bài hát, Xóa bài hát, Chuyển album.
- **Query (Đọc)**: Các thao tác chỉ lấy dữ liệu ra mà không làm thay đổi state. Ví dụ: Lấy danh sách bài hát, Lấy chi tiết một bài hát.

Trong NestJS, kiến trúc này được hỗ trợ sẵn bởi package `@nestjs/cqrs` thông qua `CommandBus` và `QueryBus`.

---

## 2. Luồng xử lý chi tiết (Flow)

Bất kỳ request nào từ Client gửi lên đều đi qua 4 tầng chính:

**[Client] ➔ Controller ➔ Service ➔ Bus (CommandBus/QueryBus) ➔ Handler ➔ (Helpers / Repository)**

### Bước 1: Controller (`song.controller.ts`)
- **Nhiệm vụ**: Nhận HTTP Request, xác thực (Guards), lấy data từ body/params/query thông qua DTO.
- **Thực thi**: Gọi trực tiếp method tương ứng của `SongService` và truyền DTO vào.
- **Ví dụ**:
  ```typescript
  @Post('youtube')
  async createFromYoutube(@CurrentUser() user, @Body() dto: CreateSongYoutubeDto) {
    return this.songService.createFromYoutube(user.id, dto);
  }
  ```

### Bước 2: Service (`song.service.ts`)
- **Nhiệm vụ**: Trở thành một người điều phối (Orchestrator) thuần túy. Nó không chứa logic nghiệp vụ, không gọi database.
- **Thực thi**:
  - Nhận DTO từ Controller.
  - Chuyển đổi DTO thành một **Command** hoặc **Query** object.
  - Giao việc cho `CommandBus` hoặc `QueryBus`.
- **Ví dụ**:
  ```typescript
  async createFromYoutube(userId: string, dto: CreateSongYoutubeDto) {
    // 1. Tạo Command object mang theo dữ liệu thô
    const command = new CreateSongFromYoutubeCommand(userId, dto.url, dto.title, dto.artist, dto.albumId);
    
    // 2. Đẩy vào CommandBus. Bus sẽ tự tìm đúng Handler để chạy.
    return this.commandBus.execute(command);
  }
  ```

### Bước 3: Command / Query Object (`commands/...` hoặc `queries/...`)
- **Nhiệm vụ**: Chỉ là một Class chứa dữ liệu (Data Transfer Object nội bộ). Không có logic.
- **Ví dụ**:
  ```typescript
  export class CreateSongFromYoutubeCommand implements ICommand {
    constructor(
      public readonly userId: string,
      public readonly url: string,
      // ... các field khác
    ) {}
  }
  ```

### Bước 4: Handler (`*.handler.ts`)
- **Nhiệm vụ**: Chứa **toàn bộ Business Logic**. Đây là nơi thực thi nghiệp vụ cốt lõi. Mỗi Handler chỉ xử lý duy nhất 1 Command/Query.
- **Thực thi**:
  - Được đánh dấu bằng `@CommandHandler()` hoặc `@QueryHandler()`.
  - Validate dữ liệu thông qua Helpers.
  - Gọi Repository để thao tác Database.
  - Map dữ liệu trả về cho client.
- **Ví dụ**: `CreateSongFromYoutubeHandler`
  - Gọi `AlbumValidationHelper` kiểm tra album có hợp lệ không.
  - Gọi `YoutubeSongHelper` bóc tách video ID.
  - Gọi `SongRepository` lưu database.
  - Đẩy job xử lý audio vào `BullMQ`.

### Bước 5: Repository & Helpers
- **Repository (`song.repository.ts`)**: Nơi duy nhất gọi Prisma để thực thi câu lệnh SQL (find, create, update, delete).
- **Helpers**: 
  - `album-validation.helper.ts`: Tách logic xác thực album dùng chung.
  - `youtube-song.helper.ts`: Tách logic xử lý chuỗi Youtube và map Output DTO.

---

## 3. Tại sao lại chia như vậy? (Ưu điểm)

1. **Clean Code**: Service cũ quá mập (Fat Service) do gánh đủ thứ: query DB, xử lý Youtube, enqueue job. Giờ Service cực kỳ mỏng.
2. **Single Responsibility Principle (SRP)**: Mỗi file chỉ làm 1 việc duy nhất:
   - Command: Chứa data.
   - Handler: Xử lý logic.
   - Repository: Chọc DB.
3. **Dễ Test**: Muốn test tạo bài hát? Chỉ cần mock data và test thẳng file `CreateSongFromYoutubeHandler` độc lập, không cần quan tâm Controller hay Service.
4. **Dễ mở rộng**: Nếu sau này muốn tạo bài hát từ Spotify, chỉ cần tạo `CreateSongFromSpotifyCommand` và `CreateSongFromSpotifyHandler` mới, code cũ không bị đụng chạm.

---

## 4. Tóm tắt sơ đồ thư mục hiện tại

```text
songs/
 ├── commands/                  # Các thao tác GHI
 │    ├── create-youtube-song/  # Logic tạo mới từ YT
 │    ├── move-song/            # Logic đổi album
 │    └── remove-song/          # Logic xóa bài hát
 ├── queries/                   # Các thao tác ĐỌC
 │    ├── find-all-songs/       # Logic lấy danh sách
 │    └── find-one-song/        # Logic lấy chi tiết 1 bài
 ├── dto/                       # Data type cho Controller
 ├── helper/                    # Các hàm dùng chung (validate, map data)
 ├── repositories/              # Nơi giao tiếp Database (Prisma)
 ├── song.controller.ts         # Endpoint APIs
 ├── song.service.ts            # Bus Orchestrator
 └── songs.module.ts            # Đăng ký các phần tử (Providers, Handlers)
```
