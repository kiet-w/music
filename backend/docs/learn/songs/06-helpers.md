# Helpers — song-mapper & album-validation

> Hai file nhỏ nhưng quan trọng. Hiểu helper là hiểu cách tách trách nhiệm đúng cách.

---

## song-mapper.ts — Hàm thuần túy

**File:** [`helper/song-mapper.ts`](file:///home/baudui/Projects/project/music/backend/src/songs/helper/song-mapper.ts)

```typescript
// ponytail: pure functions, no class needed
export function extractYoutubeId(url: string): string | undefined {
  const match = url.match(/^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/);
  return match && match[1]?.length === 11 ? match[1] : undefined;
}

export function mapSongToResponse(song: Track): SongResponseDto {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    url: song.url,
    duration: song.duration,
    albumId: song.albumId,
    sourceType: song.sourceType,
    sourceId: song.sourceId,
    createdAt: song.createdAt,
  };
}
```

### `extractYoutubeId(url)` — Trích xuất ID từ URL YouTube

```typescript
const YOUTUBE_ID_REGEX = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/;
```

Biểu thức chính quy này nhận diện được tất cả các dạng URL YouTube phổ biến:

| Dạng URL | Ví dụ |
|----------|-------|
| Xem thông thường | `https://youtube.com/watch?v=dQw4w9WgXcQ` |
| Rút gọn | `https://youtu.be/dQw4w9WgXcQ` |
| Nhúng | `https://youtube.com/embed/dQw4w9WgXcQ` |
| Di động | `https://m.youtube.com/watch?v=dQw4w9WgXcQ` |

**Giải thích biểu thức chính quy từng phần:**
- `(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)` — nhóm nhận diện phần tiền tố trước ID
- `([^#&?]*)` — nhóm bắt ID: mọi ký tự không phải `#`, `&`, `?`
- `match[1]?.length === 11` — kiểm tra thêm: ID YouTube luôn đúng 11 ký tự

```typescript
return match && match[1]?.length === 11 ? match[1] : undefined;
```

Kiểm tra kép: phải khớp biểu thức chính quy **và** ID phải đúng 11 ký tự. Đây là độ dài cố định của mọi ID YouTube hợp lệ.

### `mapSongToResponse(song)` — Chuyển đổi dữ liệu sang định dạng phản hồi

Chuyển đổi đối tượng `Track` (mô hình Prisma, có thể chứa các quan hệ như `album`) thành `SongResponseDto` (đối tượng đơn giản gửi về cho người dùng).

**Tại sao cần chuyển đổi thay vì trả thẳng Track?**
- Đối tượng Track có thể chứa các trường nhạy cảm hoặc không cần thiết
- DTO định nghĩa chính xác những gì người dùng nhận được
- An toàn kiểu dữ liệu — TypeScript biết chính xác cấu trúc của phản hồi

### 📚 Học tập: Hàm thuần túy so với Phương thức trong Class

```typescript
// Cách cũ (dùng class)
const mapper = inject(SongMapper);
mapper.mapToResponse(song);

// Cách mới (hàm thuần túy) — ponytail: no class needed
import { mapSongToResponse } from './helper/song-mapper';
mapSongToResponse(song);
```

**Tại sao hàm thuần túy tốt hơn ở trường hợp này?**
- Không có trạng thái nội bộ, không có phụ thuộc bên ngoài
- Không cần tiêm vào hàm khởi tạo
- Dễ kiểm thử hơn (chỉ cần gọi hàm trực tiếp)
- Chính dòng comment trong code `// ponytail: pure functions, no class needed` ghi rõ lý do

---

## album-validation.helper.ts — Dịch vụ có thể tiêm

**File:** [`helper/album-validation.helper.ts`](file:///home/baudui/Projects/project/music/backend/src/songs/helper/album-validation.helper.ts)

```typescript
@Injectable()
export class AlbumValidationHelper {
  constructor(
    private readonly albumRepository: AlbumRepository,
    private readonly albumService: AlbumService,
    @InjectPinoLogger(AlbumValidationHelper.name) private readonly logger: PinoLogger,
  ) {}

  async getValidatedAlbumId(userId: string, albumId?: string): Promise<string> {
    if (albumId) {
      const album = await this.albumRepository.findUnique({ where: { id: albumId } });
      if (!album || album.userId !== userId) {
        this.logger.warn({ userId, albumId }, 'Album not found or access denied');
        throw new NotFoundException('Album not found');
      }
      return albumId;
    }

    // Không có albumId → lấy hoặc tạo album mặc định
    const defaultAlbum = await this.albumService.findOrCreateDefault(userId);
    return defaultAlbum.id;
  }
}
```

### Luồng xử lý `getValidatedAlbumId`

```
Có albumId được truyền vào?
  ├── Có → tìm album trong cơ sở dữ liệu
  │         ├── Không tìm thấy hoặc không thuộc về người dùng → ném lỗi 404
  │         └── Hợp lệ → trả về albumId
  └── Không → gọi findOrCreateDefault(userId) → trả về id album mặc định
```

**Điểm quan trọng: `findOrCreateDefault`**

Nếu người dùng chưa có album nào → tự động tạo một album "Mặc định" cho họ. Đây là tính năng nâng cao trải nghiệm: người dùng không cần tạo album trước mới thêm nhạc được.

### Tại sao cần dùng class (có thể tiêm) thay vì hàm thuần túy?

Vì `AlbumValidationHelper` cần tiêm 2 phụ thuộc khác (`AlbumRepository`, `AlbumService`) và thực hiện thao tác bất đồng bộ (truy vấn cơ sở dữ liệu). Hàm thuần túy không thể nhận phụ thuộc từ bộ tiêm của NestJS.

```
song-mapper        → hàm thuần túy   (không có phụ thuộc, không có bất đồng bộ)
album-validation   → class có thể tiêm (có phụ thuộc, có truy vấn cơ sở dữ liệu)
```

---

## 📚 Ghi chú học tập

### 🧠 Khi nào dùng hàm thuần túy, khi nào dùng class có thể tiêm?

| Tiêu chí | Hàm thuần túy | Class có thể tiêm |
|----------|--------------|------------------|
| Có cần tiêm phụ thuộc? | ❌ | ✅ |
| Có thao tác bất đồng bộ (truy vấn, gọi API)? | ❌ | ✅ |
| Chỉ biến đổi dữ liệu? | ✅ | ❌ (thừa phức tạp) |
| Cần vòng đời singleton? | ❌ | ✅ |

**Ví dụ cụ thể trong dự án:**
- `extractYoutubeId` → hàm thuần túy ✅ (chỉ xử lý chuỗi)
- `mapSongToResponse` → hàm thuần túy ✅ (chỉ ánh xạ đối tượng)
- `AlbumValidationHelper` → class có thể tiêm ✅ (cần truy vấn cơ sở dữ liệu)

---

### 🧠 Bảo mật trong `getValidatedAlbumId`

```typescript
if (!album || album.userId !== userId) {
  throw new NotFoundException('Album not found');
}
```

Cố ý ném lỗi `NotFoundException` (404) thay vì `ForbiddenException` (403). Tại sao?

→ Không để lộ sự tồn tại của album. Nếu trả về 403, kẻ tấn công sẽ biết album đó tồn tại trong hệ thống.

→ Cả hai trường hợp (không tồn tại + không có quyền truy cập) đều nhận được cùng một phản hồi 404. Kẻ tấn công không thể phân biệt.

---

### 🧠 `findOrCreateDefault` — Mẫu thiết kế hay

Thay vì bắt người dùng luôn phải truyền `albumId`:

```
Nếu không có albumId → báo lỗi "Cần cung cấp albumId"  ← ❌ Trải nghiệm tệ
Nếu không có albumId → tạo hoặc lấy album mặc định     ← ✅ Trải nghiệm tốt
```

Mẫu thiết kế này rất phổ biến trong sản phẩm thực tế — giảm rào cản cho người dùng mới. Họ có thể thêm nhạc ngay mà không cần thực hiện thêm bước nào.

---

**Cập nhật lần cuối**: 2026-07-09 — Viết lại hoàn toàn bằng tiếng Việt
