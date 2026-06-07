---

# Songs Module — AI Coding Skill Context

> File này dùng làm context cho AI coding agent khi làm việc với Songs Module.

---

## 1. Kiến trúc tổng thể — Tại sao tổ chức như vậy?

```
HTTP Request
    │
    ▼
SongController          ← Nhận/trả HTTP, định nghĩa route.
    │
    ▼
JwtAuthGuard            ← Middleware bảo vệ các thao tác của user bằng token.
    │
    ▼
SongService             ← Chứa logic nghiệp vụ chính (xác thực album, trigger background jobs).
    │
    ├──► Conversion Queue (BullMQ) ← Đẩy tác vụ nặng xuống nền (ví dụ tải nhạc từ Youtube).
    │
    ▼
SongRepository          ← Quản lý giao tiếp với Database (bảng Track).
    │
    ▼
[Database PostgreSQL]   ← Thông qua Prisma
```

**Tại sao tách các layer?**
- **Hiệu năng và Non-blocking:** Tách rời tác vụ nặng như việc clone/download file Youtube sang `JobsModule` bằng BullMQ queue giúp API Controller phản hồi ngay lập tức sau khi tạo record tạm.
- **Tách biệt Data logic:** Sử dụng `BaseRepository` cho entity `Track` giúp chuẩn hóa cách thao tác với CSDL.
- **Tái sử dụng Album Logic:** Nhúng `AlbumService` và `AlbumRepository` vào `SongService` để xử lý các logic về album mà không cần viết lại logic xác thực album tại module Song.

---

## 2. Các Dependencies

| Dependency | Vai trò |
|------------|---------|
| `SongRepository` | Giao tiếp với Database để query và thao tác với entity `Track` (qua Prisma). |
| `AlbumRepository` | Truy vấn kiểm tra album đích xem có thuộc sở hữu của user hay không. |
| `AlbumService` | Gọi các logic tạo/tìm album mặc định nếu user upload nhạc nhưng không chọn album. |
| `conversionQueue` | Nhận job `convert` từ BullMQ khi tạo bài hát bằng link Youtube. |
| `PinoLogger` | Ghi log chuẩn cấu trúc quá trình tạo nhạc, tìm kiếm nhạc, hoặc cảnh báo khi vi phạm quyền truy cập. |

---

## 3. Entry Points — Đi đâu về đâu

### 3.1. POST /songs/youtube

```
Client gửi (Body: CreateSongYoutubeDto): { url, title, artist?, albumId? }
    │
    ▼ Controller.createFromYoutube(user, dto)
    │   → Decorators: @Post('youtube'), @ApiOperation
    │
    ▼ SongService.createFromYoutube(...)
    │   1. Lấy thông tin xác thực album (getValidatedAlbumId).
    │   2. Lưu Track record tạm thời có sourceType là 'youtube' vào DB.
    │   3. conversionQueue.add('convert', payload) → Bắn event cho worker xử lý async việc down/convert file.
    │
    ▼ SongService.mapToResponse(song)
    │   → Lọc dữ liệu qua Dto để hide các trường không public.
    │
    ▼ Trả về: { id, title, artist, url, albumId, sourceType } (SongResponseDto)

Lỗi có thể xảy ra:
- 404 NotFoundException → Album chỉ định không tồn tại hoặc không thuộc quyền sở hữu của user.
```

### 3.2. GET /songs

```
Client Request: /songs?page=1&limit=10 (Header: Authorization)
    │
    ▼ Controller.findAll(user, page, limit)
    │   1. Tính `skip` (số lượng bỏ qua) và `take` (số lượng lấy).
    │
    ▼ SongService.findAll(skip, take)
    │   1. Promise.all gọi Repository đếm `total` và `data`. Lọc theo `album.userId = user.id`.
    │
    ▼ Trả về: { data: SongResponseDto[], total, page, limit, totalPages }
```

### 3.3. DELETE /songs/:id

```
Client Request: DELETE /songs/:id (Header: Authorization)
    │
    ▼ Controller.remove(user, id)
    │   → @HttpCode(204)
    │
    ▼ SongService.remove(userId, id)
    │   1. SongService.findAndValidateSong(userId, id) → Kiểm tra quyền. Nếu không tìm thấy → ném 404.
    │   2. SongRepository.delete({ where: { id } })
    │
    ▼ Trả về: Trống (Status 204 No Content)
```

### 3.4. PATCH /songs/:id/move

```
Client Request (Body): { albumId }
    │
    ▼ Controller.moveToAlbum(user, id, albumId)
    │
    ▼ SongService.moveToAlbum(userId, id, albumId)
    │   1. SongService.findAndValidateSong(userId, id) → Check track có tồn tại.
    │   2. SongService.getValidatedAlbumId(userId, albumId) → Check album mới.
    │   3. SongRepository.update(data: { albumId })
    │
    ▼ Trả về: SongResponseDto
```

---

## 4. Đánh giá — Đã tốt chưa?

### ✅ Đã làm tốt

| Điểm tốt | Lý do |
|----------|-------|
| Background Job | Sử dụng tốt hàng đợi BullMQ để tránh gây ngẽn luồng xử lý HTTP khi tải nhạc Youtube. |
| Data DTO Formatting | Sử dụng `plainToInstance` với cấu hình `excludeExtraneousValues: true` đảm bảo Response trả về chuẩn, che giấu các trường nhạy cảm trong DB (như ngày cập nhật, flag admin, v.v.). |
| Quản lý quyền bài hát | Cách kiểm tra quyền truy cập thông qua relationship với Album (`album: { userId }`) được dùng thống nhất. |

### ❌ Chưa tốt / Cần cải thiện

**1. Xử lý tính Pagination thủ công ở Controller**
```typescript
// HIỆN TẠI — vấn đề:
// Controller tự phân tích chuỗi query sang Int, tính công thức skip. Không an toàn và dư thừa code (lặp lại giống Auth module).
const skip = page && limit ? (parseInt(page, 10) - 1) * parseInt(limit, 10) : 0;
const take = limit ? parseInt(limit, 10) : 50;

// NÊN SỬA — lý do:
// Nên dùng Pipe hoặc Decorator (vd: PaginationParams) để thống nhất phân trang toàn app.
@Query() paginationDto: PaginationDto
```

---

## 5. API Design Review

### Endpoint Naming
```
POST   /songs/youtube       [✅] Rõ ràng.
GET    /songs               [✅] Chuẩn convention RESTful.
GET    /songs/:id           [✅] Chuẩn.
DELETE /songs/:id           [✅] Chuẩn.
PATCH  /songs/:id/move      [✅] Sử dụng sub-resource (action) hợp lý thay vì PUT/PATCH toàn bộ body.
```

### Response Shape
```typescript
// Các endpoint trả về chi tiết track:
{
  id: string,
  title: string,
  artist?: string,
  url: string,
  albumId?: string,
  sourceType: string
}
```

### HTTP Status Codes
```
POST   /songs/youtube → 201 Created   [✅]
GET    /songs         → 200 OK        [✅]
DELETE /songs/:id     → 204 No Content[✅] (Dùng @HttpCode(204) rất chính xác)
```

---

## 6. Cách Debug khi gặp lỗi

### Lỗi 404 NotFoundException khi làm việc với Track

```
Checklist:
1. Đảm bảo `id` của bài hát đúng định dạng.
2. Kiểm tra `albumId` đích xem album này có đang thuộc quyền sở hữu của `userId` trong JWT token hay không. Bài hát phải nằm trong Album do user tạo.

Command debug:
→ Xem log backend: "Song not found or access denied" hoặc "Album not found or access denied"
```

### Lỗi bài hát tạo từ Youtube mãi không nghe được

```
Checklist:
1. Logic down load chạy qua BullMQ, kiểm tra xem redis có đang hoạt động không (`JobsModule`).
2. Xem log worker xem job `convert` có báo lỗi timeout hay lỗi Youtube parser không.
```

---

## 7. Các Pattern quan trọng trong module này

### Pattern 1: Tách nền Background Processing bằng Message Queue
```typescript
// Tại sao dùng pattern này?
// → Tạo nhanh bài hát để User không phải chờ HTTP request treo trong hàng chục giây tải video.

await this.conversionQueue.add('convert', {
  url,
  songId: song.id,
  userId,
});

// Nếu KHÔNG dùng pattern này thì sao?
// → Request bị treo. Tệ hơn, nếu server bị gián đoạn, process tải bị đứt và phải tải lại từ đầu gây trải nghiệm tệ.
```

### Pattern 2: DTO Expose Serialization
```typescript
// Tại sao dùng pattern này?
// → Chỉ những thuộc tính có @Expose() trong SongResponseDto mới lọt ra ngoài JSON, bảo vệ dữ liệu nội bộ.
return plainToInstance(SongResponseDto, song, {
  excludeExtraneousValues: true,
});
```

---

## 8. Biến môi trường cần thiết

```env
# Module này phụ thuộc vào cấu hình Queue ở JobsModule, do vậy cần có Redis
REDIS_HOST=            # Host của redis
REDIS_PORT=            # Port của redis
```

---

## 9. Khi AI agent làm việc với module này

**Trước khi thêm feature mới:**
- Mọi truy vấn liên quan đến `Track` luôn phải đi kèm cơ chế xác thực quyền sở hữu thông qua `Album` (`album: { userId }`), không bao giờ query riêng biệt chỉ bằng `id`.
- Logic phải được đóng gói tại `SongService` và gọi DB tại `SongRepository`.

**Khi sửa tính năng Upload:**
- Bắt buộc phải duy trì mô hình Queue. Tuyệt đối không nhúng logic tải hoặc convert trực tiếp bằng thread chính của request ở Controller hoặc Service thông thường.

**Khi thêm endpoint mới:**
- Trả response qua hàm helper `mapToResponse` để chuẩn hóa DTO trước khi xuất ra cho client.
- Bảo mật bằng `@UseGuards(JwtAuthGuard)` và `@ApiBearerAuth()` để đảm bảo người dùng có quyền và hiển thị trên Swagger UI.
