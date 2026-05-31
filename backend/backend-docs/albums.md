# Module: albums (Micro-Technical Detail)

Module `albums` quản lý thông tin về các album nhạc, bao gồm việc tạo mới, truy xuất danh sách và chi tiết từng album cùng với các bài hát (tracks) bên trong nó.

---

## 1. Thành phần chính
- **Controller**: `src/albums/album.controller.ts`
- **Service**: `src/albums/album.service.ts`
- **Repository**: `src/albums/repositories/album.repository.ts`
- **DTOs**: `CreateAlbumDto`, `AlbumResponseDto`

---

## 2. Chi tiết Controller (`AlbumController`)

Được đánh dấu bằng `@Controller('albums')`, `@ApiTags('albums')`, và sử dụng `@UseInterceptors(ClassSerializerInterceptor)` để tự động transform data đầu ra theo các rule trong DTO (như `@Expose`).

### `create` (`POST /`)
- **Impact**: Tạo mới một album.
- **In/Out**:
    - **In**: `createAlbumDto` (`CreateAlbumDto` qua `@Body`).
    - **Out**: `AlbumResponseDto` (HTTP 201).
- **Logic**: 
    - Gọi `this.albumService.create(createAlbumDto)`.
    - Dùng `plainToInstance(AlbumResponseDto, album)` để format dữ liệu trả về chuẩn theo DTO.

### `findAll` (`GET /`)
- **Impact**: Lấy danh sách toàn bộ albums. Có sử dụng cache.
- **In/Out**:
    - **In**: Không có tham số.
    - **Out**: Mảng `AlbumResponseDto[]` (HTTP 200).
- **Logic**:
    - Áp dụng `@UseInterceptors(CacheInterceptor)` để tự động cache response.
    - Gọi `this.albumService.findAll()`.
    - Dùng `plainToInstance(AlbumResponseDto, albums)` để format danh sách trả về.

### `findOne` (`GET /:id`)
- **Impact**: Lấy chi tiết một album theo ID.
- **In/Out**:
    - **In**: `id` (`@Param('id')`).
    - **Out**: `AlbumResponseDto` (HTTP 200) hoặc 404 nếu không tìm thấy.
- **Logic**:
    - Gọi `this.albumService.findOne(id)`.
    - Dùng `plainToInstance(AlbumResponseDto, album)` format dữ liệu.

---

## 3. Chi tiết Service (`AlbumService`)

### `create` (Public)
- **Impact**: Lưu thông tin album mới vào DB.
- **Micro-Logic**:
    - `` `return this.albumRepository.create({ data });` `` — Gọi trực tiếp hàm create của repository, truyền các trường `title`, `artist`, `coverUrl`.

### `findAll` (Public)
- **Impact**: Lấy toàn bộ album kèm theo số lượng bài hát (tracks) bên trong.
- **Micro-Logic**:
    - `` `include: { tracks: true, _count: { select: { tracks: true } } }` `` — Dùng Prisma để lấy cả danh sách tracks và đếm số lượng tracks (`_count`).
    - `` `_count: { songs: album._count?.tracks || 0 }` `` — Xử lý map lại tên trường từ `tracks` (trong DB) sang `songs` (để trả về API) đảm bảo tính nhất quán của response.

### `findOne` (Public)
- **Impact**: Lấy chi tiết một album kèm số lượng track của nó.
- **Micro-Logic**:
    - Query dùng `include` lấy `tracks` và đếm `_count.tracks` giống như `findAll`.
    - Trả về `null` nếu không tìm thấy.
    - `` `_count: { songs: albumWithCount._count?.tracks || 0 }` `` — Map lại trường đếm từ `tracks` thành `songs`.

---

## 4. Repository & Data Layer (`AlbumRepository`)

Kế thừa từ `BaseRepository` (cung cấp sẵn các thao tác CRUD cơ bản).
- **Impact**: Cung cấp thêm method truy vấn đặc thù cho Album.
- **In/Out**: Sử dụng `PrismaService` và `Prisma.AlbumDelegate`.

### `findByTitleAndArtist`
- **Impact**: Tìm kiếm album dựa vào cả `title` và `artist`.
- **Micro-Logic**:
    - `` `return this.prisma.album.findFirst({ where: { title, artist } });` `` — Sử dụng `findFirst` query chính xác trên 2 field để kiểm tra trùng lặp hoặc tra cứu.

---

## 5. Cấu trúc DTO (In/Out Shapes)

### `CreateAlbumDto`
- `title`: `string` (Validator: `@IsString`, `@IsNotEmpty`, Swagger: `@ApiProperty`)
- `artist`: `string` (Optional, Validator: `@IsString`, `@IsOptional`)
- `coverUrl`: `string` (Optional, Validator: `@IsUrl`, `@IsOptional`)

### `AlbumResponseDto`
*Sử dụng `@Expose` cho tất cả các field trả về (do dùng `ClassSerializerInterceptor`).*
- `id`: `string`
- `title`: `string`
- `artist`: `string`
- `coverUrl`: `string`
- `tracks`: `SongResponseDto[]` (Optional, biến đổi lồng nhau qua `@Type(() => SongResponseDto)`)
- `_count`: Object `{ songs: number }` (Optional, số lượng bài hát)
