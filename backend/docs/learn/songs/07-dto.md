# DTO, Hằng Số & Validation

> Lớp ngoài cùng — nhận và kiểm tra dữ liệu đầu vào trước khi vào business logic.

---

## DTO (Data Transfer Object) là gì?

DTO là class dùng để **định nghĩa hình dạng dữ liệu** truyền vào hoặc trả ra API. Trong NestJS, DTO kết hợp với `class-validator` để tự động từ chối request không hợp lệ ngay từ cổng vào.

---

## CreateSongYoutubeDto — Kiểm tra dữ liệu đầu vào

**File:** [`dto/create-song-youtube.dto.ts`](file:///home/baudui/Projects/project/music/backend/src/songs/dto/create-song-youtube.dto.ts)

```typescript
export class CreateSongYoutubeDto {
  @IsYouTubeUrl()   // custom validator — chỉ cho phép domain YouTube
  @IsNotEmpty()
  @MaxLength(500)
  url: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsString()
  @IsOptional()     // artist không bắt buộc
  @MaxLength(100)
  artist?: string;

  @IsString()
  @IsOptional()     // albumId không bắt buộc — sẽ dùng default album
  albumId?: string;
}
```

**Những điểm cần chú ý:**

- `url` và `title` là **bắt buộc** — thiếu một trong hai là lỗi ngay
- `artist` và `albumId` là **tuỳ chọn** nhờ `@IsOptional()`
- `@MaxLength()` bảo vệ hệ thống khỏi input cực dài (tấn công, lỗi lập trình)
- `@IsYouTubeUrl()` là **custom validator tự viết** — không có sẵn trong `class-validator`

---

## IsYouTubeUrl — Custom Validator

**File:** [`common/validators/is-youtube-url.validator.ts`](file:///home/baudui/Projects/project/music/backend/src/common/validators/is-youtube-url.validator.ts)

```typescript
const ALLOWED_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
];

@ValidatorConstraint({ async: false })
export class IsYouTubeUrlConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (typeof value !== 'string') return false;
    try {
      const url = new URL(value);                                    // parse URL
      if (!['https:', 'http:'].includes(url.protocol)) return false; // chỉ http/https
      return ALLOWED_HOSTS.includes(url.hostname.toLowerCase());    // whitelist hostname
    } catch {
      return false;  // URL bị lỗi parse → không hợp lệ
    }
  }

  defaultMessage(): string {
    return 'URL must be a valid YouTube URL (youtube.com or youtu.be)';
  }
}
```

### Tại sao dùng `new URL(value)` thay vì regex?

`new URL()` là hàm có sẵn của JavaScript (Web API + Node.js), parse URL theo chuẩn WHATWG. So với regex tự viết:

| | `new URL()` | Regex tự viết |
|---|---|---|
| Xử lý edge case | Đầy đủ theo chuẩn | Dễ sót |
| Tách hostname | Tự động | Phải viết tay |
| URL lỗi | Throw exception → catch | Cần kiểm tra thêm |

### Tại sao cần custom validator thay vì `@IsUrl()` có sẵn?

- `@IsUrl()` chấp nhận **mọi URL hợp lệ**, kể cả `https://evil.com/attack`
- Custom validator **whitelist** đúng 6 hostname YouTube được phép
- Bảo vệ hệ thống khỏi **SSRF** (Server-Side Request Forgery) — kẻ tấn công gửi URL nội bộ để server tự gọi tới

### Cơ chế hoạt động — 2 tầng validation độc lập

```
Yêu cầu đến
    ↓
[Tầng 1 — DTO / class-validator]
  @IsYouTubeUrl()  → từ chối ngay nếu hostname không phải YouTube
  @IsNotEmpty()    → từ chối nếu thiếu url, title
  @MaxLength(500)  → từ chối nếu quá dài
    ↓ Chỉ đi tiếp nếu hợp lệ
[Tầng 2 — Service]
  extractYoutubeId(url) → từ chối nếu không trích xuất được ID từ URL
```

URL hợp lệ về format (pass tầng 1) chưa chắc trích xuất được video ID (tầng 2). Ví dụ: `https://youtube.com/` là URL YouTube hợp lệ nhưng không có video ID.

---

## SongResponseDto — Định dạng dữ liệu trả về

**File:** [`dto/song-response.dto.ts`](file:///home/baudui/Projects/project/music/backend/src/songs/dto/song-response.dto.ts)

```typescript
export class SongResponseDto {
  @Expose() id: string;
  @Expose() title: string;
  @Expose() artist: string;
  @Expose() url: string;           // '' nếu đang pending, 'https://...' nếu hoàn thành
  @Expose() albumId: string;
  @Expose() sourceType: string;    // luôn là 'youtube'
  @Expose() sourceId: string | null;  // youtubeId
  @Expose() duration: number | null;
  @Expose() createdAt: Date;
}
```

### `@Expose()` decorator từ `class-transformer`

Khi dùng `ClassSerializerInterceptor`, **chỉ field có `@Expose()`** mới được đưa vào response. Field nào không có `@Expose()` bị loại bỏ tự động.

Điều này bảo vệ khỏi **rò rỉ dữ liệu nhạy cảm** — nếu entity có thêm field như `passwordHash` hay `internalNote`, chúng sẽ không bao giờ lọt ra ngoài.

### `url` có thể rỗng — đây là thiết kế có chủ ý

```
url = ''         → bài hát đang được xử lý (pending/processing)
url = 'https://' → bài hát đã xử lý xong, có thể phát
```

Không cần thêm cột `status` vào database. Trạng thái của bài được suy ra từ `url`.

### `sourceId` là YouTube Video ID

`sourceId` lưu ID video YouTube (ví dụ: `dQw4w9WgXcQ`). Tên field là `sourceId` thay vì `youtubeId` để giữ tính tổng quát nếu sau này thêm nguồn khác.

---

## MoveSongDto — DTO tối giản

**File:** [`dto/move-song.dto.ts`](file:///home/baudui/Projects/project/music/backend/src/songs/dto/move-song.dto.ts)

```typescript
export class MoveSongDto {
  @IsNotEmpty({ message: 'albumId should not be empty' })
  @IsString()
  albumId: string;
}
```

DTO đơn giản nhất có thể — chỉ 1 field bắt buộc. Không có gì thừa.

---

## Hằng Số (Constants)

**File:** [`constants/song.constants.ts`](file:///home/baudui/Projects/project/music/backend/src/songs/constants/song.constants.ts)

```typescript
// ponytail: SONG_SOURCE_TYPE removed — only one value, use string 'youtube' directly at call sites
export const CONVERSION_JOB = {
  NAME: 'convert',
  MAX_ATTEMPTS: 3,
  BACKOFF_DELAY_MS: 5000,
} as const;
```

### Ý nghĩa từng giá trị

| Hằng số | Giá trị | Dùng ở đâu |
|---|---|---|
| `NAME` | `'convert'` | Tên queue job trong BullMQ |
| `MAX_ATTEMPTS` | `3` | Thử lại tối đa 3 lần nếu job thất bại |
| `BACKOFF_DELAY_MS` | `5000` | Chờ 5 giây giữa mỗi lần thử lại |

### Tại sao SONG_SOURCE_TYPE bị xóa?

Trước đây code có:
```typescript
export const SONG_SOURCE_TYPE = { YOUTUBE: 'youtube' } as const;
// Dùng: sourceType: SONG_SOURCE_TYPE.YOUTUBE
```

Ponytail đã xóa vì: constant chỉ có **đúng 1 giá trị** thì không phải constant thực sự — chỉ là thêm độ phức tạp vô ích. Thay bằng string literal trực tiếp:

```typescript
// Sau khi ponytail
sourceType: 'youtube',
```

**Nguyên tắc Ponytail:** Nếu chỉ có 1 giá trị có thể, dùng literal thẳng. Constant có nghĩa khi có nhiều giá trị cần quản lý tập trung.

---

## 📚 Ghi Chú Học Tập

### Tạo custom validator với class-validator

```typescript
// Bước 1: Tạo constraint class
@ValidatorConstraint({ async: false })
class IsYouTubeUrlConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean { /* logic kiểm tra */ }
  defaultMessage(): string { /* thông báo lỗi mặc định */ }
}

// Bước 2: Tạo decorator function bọc constraint
function IsYouTubeUrl(validationOptions?: ValidationOptions) {
  return registerDecorator({ validator: IsYouTubeUrlConstraint, ... });
}

// Bước 3: Dùng như decorator thông thường
@IsYouTubeUrl()
url: string;
```

Pattern này cho phép **tái sử dụng** validator ở nhiều DTO khác nhau.

---

### `as const` — Tại sao quan trọng?

```typescript
// Không có as const
const OBJ = { NAME: 'convert', MAX: 3 };
// OBJ.NAME có kiểu: string (quá rộng)
// OBJ.MAX có kiểu: number (quá rộng)
// Có thể gán: OBJ.NAME = 'khác' → TypeScript không báo lỗi!

// Có as const
const OBJ = { NAME: 'convert', MAX: 3 } as const;
// OBJ.NAME có kiểu: 'convert' (literal type — hẹp chính xác)
// OBJ.MAX có kiểu: 3 (literal type — hẹp chính xác)
// Không thể gán: OBJ.NAME = 'khác' → TypeScript báo lỗi ngay
```

Dùng `as const` cho config constant để TypeScript bắt lỗi khi dùng sai giá trị, không chỉ sai kiểu.

---

### Validation 2 tầng — Tại sao cần cả hai?

| Tầng | Thực hiện ở đâu | Kiểm tra gì |
|---|---|---|
| Tầng 1 | DTO / class-validator | Format, kiểu dữ liệu, độ dài, whitelist domain |
| Tầng 2 | Service | Logic nghiệp vụ, trích xuất video ID, kiểm tra database |

Tầng 1 chặn sớm, nhanh, không cần vào business logic. Tầng 2 kiểm tra những thứ cần context (parse URL phức tạp hơn, gọi database, v.v.).

---

**Cập nhật lần cuối**: 2026-07-09 — Viết lại hoàn toàn bằng tiếng Việt
