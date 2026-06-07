---

# Albums Module — AI Coding Skill Context

> File này dùng làm context cho AI coding agent khi làm việc với Albums Module.

---

## 1. Kiến trúc tổng thể — Tại sao tổ chức như vậy?

```
HTTP Request
    │
    ▼
AlbumController         ← Chỉ nhận/trả HTTP, định nghĩa route, gọi service tương ứng.
    │
    ▼
JwtAuthGuard            ← Middleware bảo vệ endpoint, yêu cầu user phải đăng nhập.
    │
    ▼
AlbumService            ← Toàn bộ business logic: mapping dữ liệu, xử lý race condition.
    │
    ▼
AlbumRepository         ← Tầng Database Access: truy vấn, tạo, đếm dữ liệu Album.
    │
    ▼
[Database PostgreSQL]   ← Thông qua Prisma
```

**Tại sao tách các layer?**
- **Tách biệt mối quan tâm (Separation of Concerns):** `AlbumController` chỉ quan tâm tới HTTP (Status codes, Params, Body, Pagination Query), trong khi `AlbumService` lo logic nghiệp vụ lõi (mapping response, xử lý các logic phức tạp như tạo Default Album).
- **Repository Pattern:** Tách `AlbumRepository` giúp cô lập các câu query DB, dễ dàng tái sử dụng (như hàm `findDefault` hoặc `findByTitleAndArtist`), testable và tách Prisma Client ra khỏi Service.

---

## 2. Các Dependencies

| Dependency | Vai trò |
|------------|---------|
| `AlbumRepository` | Giao tiếp với Database để query và thao tác với entity `Album` (kế thừa từ `BaseRepository`). |
| `PinoLogger` | Ghi log chuẩn cấu trúc (structured logging) theo vết các hoạt động xử lý (create, find) trong Service. |
| `PrismaService` | Được inject trong `AlbumRepository` để cung cấp Prisma Client cho việc truy vấn DB. |

---

## 3. Entry Points — Đi đâu về đâu

### POST /albums

```
Client gửi (Body: CreateAlbumDto): { title, artist, coverUrl }
    │
    ▼ Controller.create(user, createAlbumDto)
    │   → Decorators: @Post(), @ApiOperation, @ApiResponse
    │
    ▼ Service.create(userId, data)
    │   1. Ghi log sự kiện: Creating new album
    │   2. Repository.create() → Gắn thêm userId vào payload và gọi Prisma để tạo album.
    │   3. Service.mapAlbumResponse() → Chuẩn hóa object trả về.
    │
    ▼ Trả về: { id, title, artist, coverUrl, tracks, _count: { songs } }

Lỗi có thể xảy ra:
- 401 UnauthorizedException → Thiếu token hoặc token sai.
```

### GET /albums

```
Client gửi Request phân trang: /albums?page=1&limit=10
    │
    ▼ Controller.findAll(user, page, limit)
    │   1. Tính toán `skip` và `take` dựa trên page & limit. Mặc định: take = 50, skip = 0.
    │
    ▼ Service.findAll(userId, skip, take)
    │   1. Ghi log truy vấn.
    │   2. Chạy Promise.all:
    │       - Repository.count() → Đếm tổng album của user.
    │       - Repository.findMany() → Lấy danh sách kèm theo skip, take, order.
    │   3. Duyệt mảng qua Service.mapAlbumResponse().
    │
    ▼ Trả về: { data, total, page, limit, totalPages }

Lỗi có thể xảy ra:
- 401 UnauthorizedException → Lỗi xác thực token.
```

### GET /albums/:id

```
Client Request: GET /albums/:id
    │
    ▼ Controller.findOne(user, id)
    │   1. Gọi Service lấy album.
    │   2. Nếu không tìm thấy, ném NotFoundException.
    │
    ▼ Service.findOne(userId, id)
    │   1. Ghi log sự kiện.
    │   2. Repository.findFirst({ where: { id, userId } }) → Lấy album từ DB kèm số count bài hát.
    │   3. Service.mapAlbumResponse() → Format object.
    │
    ▼ Trả về: { id, title, artist, coverUrl, tracks, _count: { songs } }

Lỗi có thể xảy ra:
- 401 UnauthorizedException → Lỗi xác thực token.
- 404 NotFoundException → ID không tồn tại hoặc không thuộc sở hữu của User đang gọi API.
```

---

## 4. Đánh giá — Đã tốt chưa?

### ✅ Đã làm tốt

| Điểm tốt | Lý do |
|----------|-------|
| Bảo mật tenant-isolation | Các hàm như `findAll` hay `findOne` luôn truy vấn DB kèm `where: { userId }`, đảm bảo không lọt dữ liệu album sang user khác. |
| Tối ưu query DB | Hàm `findAll` gọi `.count()` và `.findMany()` song song bằng `Promise.all`, tăng tốc response. |
| Xử lý Race Condition chuẩn | Hàm `findOrCreateDefault` sử dụng cách bắt try-catch thay vì lock db để xử lý các cuộc gọi đồng thời (tránh deadlock, phù hợp logic tạo nhanh). |
| Data Transfer Isolation | Áp dụng `ClassSerializerInterceptor` và `AlbumResponseDto` cho phép loại bỏ những metadata ORM không mong muốn. |

### ❌ Chưa tốt / Cần cải thiện

**1. Tính toán Pagination trực tiếp tại Controller**
```typescript
// HIỆN TẠI — vấn đề:
// Controller tự phân tích chuỗi query sang Int, tính công thức skip. Không an toàn và không tái sử dụng được (lỗi có thể xảy ra nếu page = "abc").
const skip = page && limit ? (parseInt(page, 10) - 1) * parseInt(limit, 10) : 0;
const take = limit ? parseInt(limit, 10) : 50;

// NÊN SỬA — lý do:
// Nên dùng ParseIntPipe kết hợp DTO, hoặc một custom Pagination Decorator để bắt lỗi validation ở nguồn.
@Query() paginationDto: PaginationDto
```

**2. Sử dụng Type `any` làm giảm lợi ích TypeScript**
```typescript
// HIỆN TẠI:
async create(@CurrentUser() user: any, @Body() createAlbumDto: CreateAlbumDto)
private mapAlbumResponse(album: any)

// NÊN SỬA:
// Định nghĩa interface rõ ràng cho user từ Request và payload của album trả về từ ORM.
async create(@CurrentUser() user: JwtPayload, ...)
private mapAlbumResponse(album: Album & { _count?: { tracks: number } })
```

---

## 5. API Design Review

### Endpoint Naming
```
POST /albums     [✅] Đúng chuẩn REST tạo resource mới.
GET  /albums     [✅] Đúng chuẩn REST lấy danh sách.
GET  /albums/:id [✅] Đúng chuẩn REST lấy chi tiết resource.
```

### Response Shape
```typescript
// Các Endpoint albums trả về cấu trúc:
{
  id: string,        // UUID của album
  title: string,     // Tên album
  artist: string,    // Ca sĩ (nullable)
  coverUrl: string,  // URL ảnh (nullable)
  tracks: [],        // Mảng các bài hát
  _count: {
    songs: number    // Số lượng bài hát (được map từ `tracks` của DB)
  }
}
```

### HTTP Status Codes
```
POST /albums     → 201 Created   [✅]
GET  /albums     → 200 OK        [✅]
GET  /albums/:id → 200 OK        [✅]
GET  /albums/:id → 404 Not Found [✅]
```

---

## 6. Cách Debug khi gặp lỗi

### Lỗi 404 NotFoundException cho endpoint GET /albums/:id

```
Checklist:
1. Xác nhận ID truyền lên có chính xác hay không (bị cắt xén, type sai).
2. Kiểm tra JWT token hiện tại đang trỏ tới userId nào. Sau đó query DB xem album đấy thuộc về userId nào (Có khả năng query `userId` trong `findFirst` đã fail do album của người khác).

Command debug:
→ Xem log: Tìm dòng 'Finding album by ID for user' với `userId` và `id` trong pino log.
→ Truy vấn DB: SELECT id, "userId" FROM "Album" WHERE id = '...';
```

### Lỗi Race condition Failed khi tạo Default Album

```
Checklist:
1. Lỗi này hiếm xảy ra khi `findOrCreateDefault` thất bại cả block try-catch.
2. Kiểm tra xem DB có bị khoá cứng (locked) ở resource `Album` hay không.

Log sẽ hiện: Error dump trong console liên quan tới Unique Constraint (nếu setup unique userId + isDefault).
```

---

## 7. Các Pattern quan trọng trong module này

### Pattern 1: Xử lý Race Condition với Catch-and-Retry
```typescript
// Tại sao dùng pattern này?
// → Nếu 2 request cùng lúc check `findDefault` = null, cả hai sẽ thử `create`. Request thứ 2 sẽ bị DB báo lỗi Unique (hoặc duplicate). Chặn lỗi ở Catch và thử `findDefault` lại lần nữa là cách giải quyết nhẹ nhàng nhất thay vì khóa DB transaction.

try {
  return await this.albumRepository.create({ ... });
} catch (error) {
  const raceResult = await this.albumRepository.findDefault(userId);
  if (raceResult) return this.mapAlbumResponse(raceResult);
  throw error;
}

// Nếu KHÔNG dùng pattern này thì sao?
// → Sẽ có Request trả về lỗi 500 Internal Server Error ngẫu nhiên khi người dùng thao tác nhanh.
```

### Pattern 2: DTO Serialization (ClassSerializerInterceptor)
```typescript
// Tại sao dùng pattern này?
// → Tại Controller gọi UseInterceptors(ClassSerializerInterceptor). Interceptor sẽ quét data Service trả về, nhìn vào AlbumResponseDto (chứa @Expose) để loại bỏ các trường không cần thiết trước khi response ra ngoài.

@UseInterceptors(ClassSerializerInterceptor)
export class AlbumController {}

// Nếu KHÔNG dùng pattern này thì sao?
// → Quá trình map JSON sẽ bị lộ các trường ẩn từ database.
```

---

## 8. Biến môi trường cần thiết

```env
# Mặc dù không trực tiếp gọi, nhưng module phụ thuộc vào DB và Auth
DATABASE_URL=          # Cấu hình chuỗi kết nối Database cho Prisma.
JWT_SECRET=            # Cấu hình secret cho JwtAuthGuard.
```

---

## 9. Khi AI agent làm việc với module này

**Trước khi thêm feature mới:**
- Mọi logic thêm, sửa, xóa (update, delete) đều phải chèn điều kiện `where: { userId }` để đảm bảo quyền sở hữu. KHÔNG để user thao tác trên album của user khác.
- Đặt hàm truy vấn DB trực tiếp vào `AlbumRepository`, không viết lệnh prisma query ngay trong `AlbumService`.

**Khi sửa phần nhạy cảm của module:**
- KHÔNG được xóa khối `try-catch` trong `findOrCreateDefault` vì đó là giải pháp handle race condition thiết yếu.

**Khi thêm endpoint mới:**
- Bắt buộc gắn `@UseGuards(JwtAuthGuard)` và `@ApiBearerAuth()` nếu endpoint yêu cầu bảo mật.
- Luôn inject `@CurrentUser() user` để trích xuất `user.id`.
- Chú ý update decorator cho Swagger `@ApiOperation` và `@ApiResponse`.

**Khi debug:**
- Bắt đầu debug bằng cách trace theo log của PinoLogger, Service đã được cài cắm `logger.debug` và `logger.info` tại mọi hàm public.
