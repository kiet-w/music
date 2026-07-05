# songs — AI Coding Skill Context

> File này dùng làm context cho AI coding agent khi làm việc với songs.

---

## 1. Kiến trúc tổng thể — Tại sao tổ chức như vậy?

```
HTTP Request
    │
    ▼
SongsController          ← Chỉ nhận/trả HTTP, KHÔNG chứa logic
    │
    ▼
[JwtAuthGuard / ThrottlerGuard] ← Chống spam và xác thực
    │
    ▼
SongsService             ← Orchestrator: Gom data đẩy sang Bus
    │
    ▼
CommandBus / QueryBus   ← Module phân phối (CQRS)
    │
    ▼
Handlers                ← Business Logic thực tế
    │
    ▼
SongRepository          ← Chỉ giao tiếp với Prisma DB
```

**Tại sao tách các layer?**
- Tách theo kiến trúc **CQRS** giúp module xử lý tốt hơn sự phình to của Business Logic.
- Service cũ quá dài (hơn 200 dòng), việc chia nhỏ Handler giúp SRP (Single Responsibility Principle) được đảm bảo.
- Tách Controller/Service/Handler/Repository giúp UnitTest cực kỳ dễ dàng vì các layer độc lập, decouple.

---

## 2. Các Dependencies

| Dependency | Vai trò |
|------------|---------|
| CqrsModule | Core CQRS, cung cấp CommandBus, QueryBus |
| JobsModule (BullMQ) | Đẩy tác vụ convert YouTube URL sang MP3 vào background |
| AlbumsModule | Cung cấp logic xác thực album hoặc sinh album mặc định |

---

## 3. Entry Points — Đi đâu về đâu

### POST /songs/youtube

```
Client gửi: { url, title, artist?, albumId? }
    │
    ▼ Controller.createFromYoutube()
    │   → Pass DTO xuống Service
    │
    ▼ Service.createFromYoutube()
    │   → Bắn CreateSongFromYoutubeCommand
    │
    ▼ CreateSongFromYoutubeHandler.execute()
    │   1. Lấy Album hợp lệ (có fallback)
    │   2. Extract YoutubeID để tái sử dụng (giảm dung lượng ổ cứng lưu trữ chung link)
    │   3. Lưu pending track vào DB
    │   4. Bắn job xuống Queue để tải audio 
    │
    ▼ Trả về: { id, title, url (tạm rỗng), ... }

Lỗi có thể xảy ra:
- 429 TooManyRequests → Nếu spam liên tục (ThrottlerGuard).
- 404 NotFoundException → AlbumID sai hoặc không sở hữu.
```

---

## 4. Đánh giá — Đã tốt chưa?

### ✅ Đã làm tốt

| Điểm tốt | Lý do |
|----------|-------|
| Chia để trị (CQRS) | Giúp module siêu gọn gàng, đọc 1 Handler là hiểu 1 API. |
| Cache Audio (Tái sử dụng) | Tiết kiệm tài nguyên lớn cho server nếu nhiều user add chung 1 bài. |
| Background Job | Client không phải chờ server parse và download âm thanh xong mới được trả về response. |

### ❌ Chưa tốt / Cần cải thiện

**1. Queue Retry chưa có Dead Letter Queue**
```typescript
// HIỆN TẠI — vấn đề:
// Nếu lỗi 3 lần, job sẽ bị vứt đi. Không có chỗ quản lý failed job.
await this.conversionQueue.add('convert', {...}, { attempts: 3 });

// NÊN SỬA — lý do:
// Cần có luồng webhook/event từ Queue báo về DB là "Conversion Failed" để cập nhật status của bài hát trên UI (báo lỗi cho user).
```

---

## 5. API Design Review

### Endpoint Naming
```
POST /songs/youtube     [✅] Hành động cụ thể (create by source).
PATCH /songs/:id/move   [✅] Dùng PATCH hợp lý cho partial update.
```

### Response Shape
```typescript
// Các endpoint trả về chi tiết bài hát:
{
  id: string,
  title: string,
  url: string,
  albumId: string,
  // Dùng @Expose() từ class-transformer để đảm bảo không lọt info dư.
}
```

---

## 6. Cách Debug khi gặp lỗi

### Lỗi 404 Not Found (Xóa, Move, FindOne)

```
Checklist:
1. Đảm bảo user gửi đúng Bearer token (đúng user).
2. Code luôn check theo cặp `id` và `userId` (sử dụng `findByUserAndId`). Lỗi này 90% do truyền nhầm ID hoặc cố tình chọc vào bài hát của người khác.

Command debug:
→ Chạy query check: prisma.track.findFirst({ where: { id: "xxx" }}) xem userId của bản ghi đó là gì.
```

### Lỗi Queue không chạy (Youtube URL rỗng mãi)

```
Checklist:
1. Kiểm tra worker bên module `jobs` có đang listen queue `conversion` không.
2. Kiểm tra Redis server có đang chạy hay sập.

Log sẽ hiện: Xem log bằng cách grep "adding to conversion queue" trong terminal.
```

---

## 7. Các Pattern quan trọng trong module này

### Pattern 1: Command Handler Delegate
```typescript
// Tại sao dùng pattern này?
// → Loại bỏ fat-service, decouple logic.

// Code ví dụ:
export class SongsService {
  constructor(private commandBus: CommandBus) {}
  async remove(userId: string, id: string) {
    return this.commandBus.execute(new RemoveSongCommand(userId, id));
  }
}
```

### Pattern 2: DTO Serialization (Class-Transformer)
```typescript
// Tại sao dùng pattern này?
// → Prisma trả về cả entity lẫn related entities, nếu return thẳng có thể lọt dữ liệu nhạy cảm.
export function mapToResponse(song: any) {
  return plainToInstance(SongResponseDto, song, {
    excludeExtraneousValues: true,
  });
}
```

---

## 9. Khi AI agent làm việc với module này

**Trước khi thêm feature mới:**
- Mọi thao tác ghi (Create, Update, Delete) phải sinh ra `[Name]Command` và `[Name]Handler`.
- Mọi thao tác đọc (Find) phức tạp nên sinh ra `[Name]Query`.
- Không được viết trực tiếp Business Logic hay gọi Repository từ bên trong `SongsService`.

**Khi thêm endpoint mới:**
- Bắt buộc gắn `@UseGuards(JwtAuthGuard)` để lấy user.
- Parameter từ body phải đi qua DTO có validator.
- Hàm trả về phải được map qua `SongResponseDto` thông qua Helper.

**Khi debug:**
- Bắt đầu debug từ file Handler chứa luồng tương ứng. Chú ý đọc Pino log vì mình đã gắn `@InjectPinoLogger` cho tất cả các Handler.
