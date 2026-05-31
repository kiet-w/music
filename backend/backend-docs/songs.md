# Module: songs (Micro-Technical Detail)

Module `songs` quản lý toàn bộ các thao tác liên quan đến bài hát (tracks). Module này tích hợp chặt chẽ với module `jobs` để xử lý tải nhạc ngầm và module `albums` để gắn kết bài hát vào các album cụ thể.

---

## 1. Thành phần chính
- **Controller**: `src/songs/song.controller.ts`
- **Service**: `src/songs/song.service.ts`
- **Repository**: `src/songs/repositories/song.repository.ts`
- **DTOs**: `CreateSongYoutubeDto`, `SongResponseDto`

---

## 2. Chi tiết Controller (`SongController`)

Được bảo vệ và format bởi `@UseInterceptors(ClassSerializerInterceptor)`. Data trả về sẽ được dùng hàm `plainToInstance(SongResponseDto, data, { excludeExtraneousValues: true })` để ép kiểu chuẩn xác 100% theo DTO (loại bỏ các trường dư thừa từ DB).

### `createFromYoutube` (`POST /youtube`)
- **Impact**: Endpoint nhận yêu cầu thêm bài hát mới từ một đường dẫn YouTube.
- **In/Out**:
    - **In**: `CreateSongYoutubeDto` (Body chứa `url`, `title`, `artist`, `albumId`).
    - **Out**: `SongResponseDto` (HTTP 201). Trả về thông tin bài hát với URL ban đầu có thể là rỗng (vì đang tải).
- **Logic**: Gọi `this.songService.createFromYoutube(...)`.

### `findAll` (`GET /`)
- **Impact**: Lấy danh sách toàn bộ bài hát. Áp dụng `@UseInterceptors(CacheInterceptor)` để tăng tốc bằng cache.
- **Out**: `SongResponseDto[]`.

### `findOne` (`GET /:id`)
- **Impact**: Lấy chi tiết một bài hát theo ID.

### `remove` (`DELETE /:id`)
- **Impact**: Xóa một bài hát theo ID. Trả về HTTP 204 No Content.

### `moveToAlbum` (`PATCH /:id/move`)
- **Impact**: Chuyển bài hát sang một album khác.
- **In**: `albumId` (từ Body).

---

## 3. Chi tiết Service (`SongService`)

### `createFromYoutube` (Public)
- **Impact**: Tạo bản ghi rỗng cho bài hát mới và đẩy một job tải nhạc vào queue để background worker (`jobs` module) xử lý.
- **Micro-Logic**:
    - **Xử lý Album rỗng**: Nếu người dùng truyền vào `albumId` bị trống, hệ thống sẽ tự động tìm một album có tên là `"Default"`.
        - `` `let defaultAlbum = await this.albumRepository.findMany({ where: { title: 'Default' }, take: 1 }).then((albums) => albums[0]);` ``
        - Nếu album "Default" chưa có trong DB, nó sẽ tự động tạo ra: `` `await this.albumRepository.create({ data: { title: 'Default', artist: 'Various Artists' } });` ``
    - **Tạo bản ghi nháp**: Gọi `this.songRepository.create(...)`. Lưu ý trường `url: ''` (để trống tạm thời), `sourceType: 'youtube'`.
    - **Đẩy Job**:
        - `` `await this.conversionQueue.add('convert', { url, songId: song.id });` `` — Đẩy event có tên `'convert'` vào Queue BullMQ (được định nghĩa trong constructor qua `@InjectQueue('conversion')`). Background worker sẽ nhận và tải bài hát này.

### `findAll` / `findOne` (Public)
- **Micro-Logic**: Đều gọi repository tương ứng, luôn sử dụng `` `include: { album: true }` `` để fetch sẵn thông tin album liên quan (join bảng).

### `remove` (Public)
- **Impact**: Xóa bài hát. Có check NotFound.
- **Micro-Logic**: `` `const song = await this.songRepository.findUnique({ where: { id } }); if (!song) throw new NotFoundException('Song not found');` ``

### `moveToAlbum` (Public)
- **Impact**: Update đổi khóa ngoại `albumId` của bản ghi Track để link tới Album khác.

---

## 4. Repository & Data Layer (`SongRepository`)

- **Impact**: Kế thừa `BaseRepository`. Map tới bảng `Track` trong Prisma.
- **Micro-Logic**:
    - Truyền `prisma.track` vào cho `super(prisma, prisma.track)`.

---

## 5. Cấu trúc DTO (In/Out Shapes)

### `CreateSongYoutubeDto`
- `url`: `string` (`@IsUrl`, `@IsNotEmpty`)
- `title`: `string` (`@IsString`, `@IsNotEmpty`)
- `artist`: `string` (Optional)
- `albumId`: `string` (Optional)

### `SongResponseDto`
*Tất cả có `@Expose()` để ClassSerializerInterceptor nhận diện.*
- `id`: `string`
- `title`: `string`
- `artist`: `string`
- `url`: `string` (Đường dẫn public cuối cùng của file mp3)
- `albumId`: `string`
- `sourceType`: `string` (Ví dụ: `'youtube'`, `'google-drive'`)
