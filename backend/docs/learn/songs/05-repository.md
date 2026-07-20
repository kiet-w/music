# SongRepository & BaseRepository — Tài liệu học tập

> **File nguồn:**
> - `src/common/repositories/base.repository.ts`
> - `src/songs/repositories/song.repository.ts`

---

## Phần 1: BaseRepository — Generic pattern

### Vấn đề cần giải quyết

Khi dùng Prisma, mỗi thao tác DB đều có thể ném ra `PrismaClientKnownRequestError` với các mã lỗi riêng (`P2002`, `P2025`, `P2003`, …). Nếu không xử lý, NestJS sẽ trả về lỗi 500 không rõ ràng cho client.

Nếu mỗi repository tự xử lý lỗi → code trùng lặp ở mọi nơi.

**Giải pháp:** `BaseRepository` xử lý lỗi Prisma một lần duy nhất, tất cả repository con kế thừa.

---

### Cấu trúc Generic

```typescript
export abstract class BaseRepository<
  T,
  Delegate extends {
    findMany(args?: any): Promise<T[]>;
    findUnique(args: any): Promise<T | null>;
    findFirst(args?: any): Promise<T | null>;
    create(args: any): Promise<T>;
    update(args: any): Promise<T>;
    delete(args: any): Promise<T>;
    count(args?: any): Promise<number>;
  },
> {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly delegate: Delegate,
  ) {}
}
```

**Giải thích Generic `<T, Delegate>`:**

- `T` — kiểu dữ liệu của entity (ví dụ: `Track`, `Album`, `User`)
- `Delegate` — kiểu của Prisma delegate tương ứng (ví dụ: `Prisma.TrackDelegate<any>`)

Prisma sinh ra một "delegate" cho mỗi model — đây là object có các method `findMany`, `create`, `update`, … tương ứng với model đó. Thay vì gọi `prisma.track.findMany()`, ta đặt `prisma.track` vào `this.delegate` rồi gọi `this.delegate.findMany()`.

**`SongRepository` truyền vào như thế nào:**

```typescript
export class SongRepository extends BaseRepository<
  Track,              // T = Track (kiểu Prisma model)
  Prisma.TrackDelegate<any>  // Delegate = TrackDelegate
> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.track);  // delegate = prisma.track
  }
}
```

→ `BaseRepository` giờ biết cách gọi `prisma.track.findMany()`, `prisma.track.create()`, … mà không cần biết đó là `track` hay `album`.

---

### `handlePrismaError` — Bản đồ lỗi Prisma sang HTTP

```typescript
protected async handlePrismaError(error: unknown): Promise<never> {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        // Vi phạm unique constraint (ví dụ: email đã tồn tại)
        const target = (error.meta?.target as string[]) || ['unknown'];
        throw new ConflictException(`Record with this ${target.join(', ')} already exists`);
      }
      case 'P2025':
        // Record không tìm thấy (ví dụ: update/delete không tồn tại)
        throw new NotFoundException(error.meta?.cause || 'Record not found');
      case 'P2003':
        // Vi phạm foreign key (ví dụ: albumId không tồn tại)
        throw new BadRequestException('Foreign key constraint failed');
      default:
        throw new InternalServerErrorException(`Database error: ${error.code}`);
    }
  }
  throw error; // lỗi khác (không phải Prisma) → ném lại nguyên xi
}
```

**Bảng mã lỗi Prisma:**

| Mã Prisma | Nguyên nhân | HTTP Exception |
|---|---|---|
| `P2002` | Vi phạm unique constraint | `409 ConflictException` |
| `P2025` | Record không tồn tại | `404 NotFoundException` |
| `P2003` | Vi phạm foreign key | `400 BadRequestException` |
| Khác | Lỗi DB không xác định | `500 InternalServerErrorException` |

---

### Các method CRUD trong BaseRepository

Mỗi method đều có cùng cấu trúc: gọi delegate → nếu lỗi → xử lý qua `handlePrismaError`.

```typescript
async findMany(args?: ...): Promise<T[]> {
  try {
    return await this.delegate.findMany(args);
  } catch (error) {
    return this.handlePrismaError(error);
  }
}

async findFirst(args?: ...): Promise<T | null> {
  try {
    return await this.delegate.findFirst(args);
  } catch (error) {
    return this.handlePrismaError(error);
  }
}

async create(args: ...): Promise<T> {
  try {
    return await this.delegate.create(args);
  } catch (error) {
    return this.handlePrismaError(error);
  }
}

// update, delete, count — tương tự
```

**Lợi ích DRY (Don't Repeat Yourself):** Thay vì viết try/catch ở mỗi repository, chỉ cần viết một lần ở `BaseRepository`. Nếu muốn thêm logging hoặc metrics cho DB, chỉ sửa một chỗ.

---

## Phần 2: SongRepository — 5 custom method

`SongRepository` kế thừa toàn bộ `BaseRepository` và thêm các query đặc thù cho bài hát.

### Khởi tạo

```typescript
@Injectable()
export class SongRepository extends BaseRepository<Track, Prisma.TrackDelegate<any>> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.track);
  }
}
```

`super(prisma, prisma.track)` truyền `prisma.track` làm `delegate` → từ giờ `this.delegate.findMany()` = `prisma.track.findMany()`.

---

### Method 1: `findByYoutubeId` — Tìm bài đã convert xong

```typescript
async findByYoutubeId(youtubeId: string): Promise<Track | null> {
  return this.findFirst({
    where: {
      sourceType: 'youtube',
      sourceId: youtubeId,
      url: { not: '' },   // url != '' → đã convert xong
    },
    include: { album: true },
  });
}
```

**Điều kiện `url: { not: '' }`** — đây là cách Prisma lọc "không bằng". Bài hát có `url != ''` nghĩa là worker đã upload xong và cập nhật URL thật.

---

### Method 2: `findPendingByYoutubeId` — Tìm bài đang pending

```typescript
async findPendingByYoutubeId(youtubeId: string): Promise<Track | null> {
  return this.findFirst({
    where: {
      sourceType: 'youtube',
      sourceId: youtubeId,
      url: '',            // url = '' → đang chờ convert
    },
    include: { album: true },
  });
}
```

So sánh với `findByYoutubeId`:

| | `findByYoutubeId` | `findPendingByYoutubeId` |
|---|---|---|
| Điều kiện `url` | `{ not: '' }` (đã có URL) | `''` (chưa có URL) |
| Mục đích | Tìm bài hoàn thành để reuse file | Tìm bài đang convert để tránh duplicate job |
| Dùng ở đâu | Tầng 1 deduplication | Tầng 2 & race check |

---

### Method 3: `findByUserAndId` — Security filter

```typescript
async findByUserAndId(userId: string, id: string): Promise<Track | null> {
  return this.findFirst({
    where: { id, userId },   // CẢ HAI điều kiện phải match
    include: { album: true },
  });
}
```

**Tại sao không dùng `findUnique({ where: { id } })`?**

- `findUnique` chỉ filter theo `id` → tìm được bài của người khác
- `findFirst` với `{ id, userId }` → chỉ trả về bài hát nếu thuộc đúng user

Nếu `id` hợp lệ nhưng `userId` không khớp → trả `null` → service throw 404 → client không biết resource có tồn tại hay không. Đây là security pattern.

---

### Method 4: `findAllByUser` — Danh sách có pagination và filter động

```typescript
async findAllByUser(
  userId: string,
  skip: number,
  take: number,
  orderBy: any,
  where: any = { userId },  // mặc định filter theo userId
): Promise<Track[]> {
  return this.findMany({
    where,      // có thể chứa thêm filter albumId từ service
    skip,
    take,
    orderBy,
    include: { album: true },
  });
}
```

**Tham số `where` là dynamic filter:**

Service truyền vào `where` đã được build sẵn:
```typescript
const where: any = { userId };
if (paginationDto.albumId) where.albumId = paginationDto.albumId;
// where = { userId: '...', albumId: '...' } nếu có filter album
```

Tham số mặc định `where = { userId }` đảm bảo nếu gọi trực tiếp không truyền `where`, vẫn an toàn.

---

### Method 5: `countByUser` — Đếm tổng bài

```typescript
async countByUser(userId: string): Promise<number> {
  return this.count({ where: { userId } });
}
```

Method đơn giản nhất. Dùng để tính `totalPages` trong pagination response.

> **Lưu ý:** Trong `findAll` của service, `count` được gọi với `where` động (có thể có `albumId`), còn `countByUser` chỉ đếm theo `userId`. `countByUser` hiện không dùng trong `findAll` mà service gọi thẳng `this.songRepository.count({ where })`.

---

## `findFirst` vs `findUnique` — Khi nào dùng cái nào?

| | `findUnique` | `findFirst` |
|---|---|---|
| Điều kiện `where` | Phải là trường **unique** (id, email, …) | Bất kỳ điều kiện nào |
| Kết quả | 1 record hoặc null | Record đầu tiên khớp hoặc null |
| Có thể kết hợp `include` | ✅ | ✅ |
| Có thể kết hợp nhiều field | ❌ (chỉ unique fields) | ✅ |

`SongRepository` dùng **`findFirst` cho tất cả** vì:
- `findByUserAndId`: cần filter `{ id, userId }` — đây không phải unique constraint
- `findByYoutubeId`: cần filter `{ sourceType, sourceId, url }` — tương tự

Chỉ khi tìm theo duy nhất `id` (đảm bảo là unique) thì mới dùng `findUnique`.

---

## `include: { album: true }` — Eager loading

Tất cả 4 method trả về `Track` đều có `include: { album: true }`:

```typescript
include: { album: true }
```

**Eager loading** nghĩa là Prisma sẽ JOIN thêm bảng `albums` và trả về dữ liệu album ngay trong cùng một query.

**Tại sao tất cả đều include?**

`mapSongToResponse` (mapper function) luôn map thông tin album vào response DTO:
```typescript
// Nếu không include { album: true }, song.album sẽ là undefined
// → mapper sẽ trả về null/undefined cho trường album trong response
```

Thay vì chỉ include khi cần, dự án chọn **luôn luôn include** để:
1. Response nhất quán — client luôn có thông tin album
2. Không bỏ sót ở một số nhánh
3. Đơn giản hóa code mapper

**Đánh đổi:** Query tốn thêm JOIN. Tuy nhiên với quy mô hiện tại, cost này không đáng kể.

---

## Tóm tắt kiến trúc

```
BaseRepository<T, Delegate>
    ├── handlePrismaError()  ← map P2002/P2025/P2003 → HTTP exceptions
    ├── findMany()
    ├── findFirst()
    ├── findUnique()
    ├── create()
    ├── update()
    ├── delete()
    └── count()

SongRepository extends BaseRepository<Track, TrackDelegate>
    ├── super(prisma, prisma.track)  ← delegate pattern
    ├── findByYoutubeId()            ← url != ''
    ├── findPendingByYoutubeId()     ← url == ''
    ├── findByUserAndId()            ← security: filter userId
    ├── findAllByUser()              ← pagination + dynamic filter
    └── countByUser()                ← tổng số bài
```

---

## Ghi chú học tập nhanh

| Khái niệm | Ý nghĩa |
|---|---|
| `url = ''` | Bài hát đang pending — chưa convert xong |
| `url != ''` | Bài hát đã có file âm thanh thật |
| `delegate pattern` | `super(prisma, prisma.track)` → gọi methods qua `this.delegate` |
| `findFirst` thay `findUnique` | Khi `where` có nhiều field không phải unique |
| `include: { album: true }` | Luôn join album để response nhất quán |
| `handlePrismaError` | Dịch lỗi Prisma sang HTTP exception, viết một lần dùng mọi nơi |
| `BaseRepository` generic | DRY — không viết try/catch ở từng repository |
