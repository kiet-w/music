# Songs Module — Tổng Quan

> Đọc file này trước. Giải thích kiến trúc tổng thể trước khi đọc từng file.

---

## ⚠️ Ghi chú quan trọng — Kiến trúc thực tế

Docs cũ mô tả Songs module dùng **CQRS pattern** (CommandBus, QueryBus, Handler riêng biệt).  
**Thực tế hiện tại:** Songs đã được **refactor về Service thẳng** — không có CommandBus, không có Handler folder.

```
backend/src/songs/
├── songs.controller.ts       ← Tầng HTTP
├── songs.service.ts          ← Business logic (tất cả nằm đây)
├── songs.module.ts           ← Cấu hình module
├── dto/                      ← Định dạng request/response
│   ├── create-song-youtube.dto.ts
│   ├── move-song.dto.ts
│   └── song-response.dto.ts
├── helper/                   ← Hàm tiện ích
│   ├── song-mapper.ts        ← extractYoutubeId + mapSongToResponse
│   └── album-validation.helper.ts
├── repositories/
│   └── song.repository.ts    ← Query database (extends BaseRepository)
└── constants/
    └── song.constants.ts     ← Cấu hình CONVERSION_JOB
```

---

## Luồng request — từ đầu đến cuối

```
HTTP Request
    ↓
SongsController          ← nhận request, lấy thông tin user từ JWT
    ↓
SongsService             ← toàn bộ business logic ở đây
    ↓
SongRepository           ← query database qua Prisma
    ↓
BullMQ Queue (Redis)     ← chỉ với createFromYoutube
    ↓
ConversionProcessor      ← xử lý ngầm (module jobs)
```

---

## Các thao tác và endpoint

| Phương thức | Endpoint | Hàm trong Service | Mô tả |
|-------------|----------|------------------|-------|
| POST | `/songs/youtube` | `createFromYoutube` | Thêm bài từ YouTube |
| GET | `/songs` | `findAll` | Lấy danh sách (phân trang, lọc) |
| GET | `/songs/:id` | `findOne` | Lấy 1 bài theo ID |
| DELETE | `/songs/:id` | `remove` | Xóa bài hát |
| PATCH | `/songs/:id/move` | `moveToAlbum` | Chuyển sang album khác |

---

## Cấu hình module

```typescript
// songs.module.ts
@Module({
  imports: [JobsModule, AlbumsModule],
  controllers: [SongsController],
  providers: [SongsService, SongRepository, AlbumValidationHelper],
  exports: [SongRepository],
})
```

**Tại sao import `JobsModule`?**  
`SongsService` cần `@InjectQueue('conversion')` — Queue này được đăng ký trong `JobsModule`.  
`JobsModule` export `BullModule` → `SongsModule` mới dùng được Queue.

**Tại sao import `AlbumsModule`?**  
`AlbumValidationHelper` cần `AlbumRepository` và `AlbumService` từ module Albums.

---

## 📚 Ghi chú học tập

### 🧠 Tại sao bỏ CQRS về Service thẳng?

**CQRS phù hợp khi:**
- Đọc và ghi cần scale riêng biệt (microservices lớn)
- Cần event sourcing
- Team lớn, nhiều người làm song song

**Service thẳng phù hợp hơn ở đây vì:**
- Ứng dụng monolith, 1 database
- Ít file hơn, ít lớp abstraction hơn
- Dễ debug hơn — đọc thẳng từ controller xuống service

**Nhận xét ponytail:** Bỏ CQRS là đúng. Thêm abstraction mà không giải quyết vấn đề thực tế = thừa.

---

### 🧠 Sơ đồ phụ thuộc giữa các module

```
SongsModule
  ├── import JobsModule     → lấy BullMQ Queue 'conversion'
  ├── import AlbumsModule   → lấy AlbumRepository + AlbumService
  └── export SongRepository → để các module khác (admin) query songs
```

**Nguyên tắc:** Chỉ export những gì module khác thực sự cần. `SongRepository` được export vì admin cần query cross-module.

---

**Tiếp theo**: [Controller](./01-controller.md) | [Service](./02-service.md)

**Cập nhật lần cuối**: 09/07/2026 — Viết lại dựa trên codebase thực tế
