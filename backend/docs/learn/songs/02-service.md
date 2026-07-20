# SongsService — Tài liệu học tập

> **File nguồn:** `src/songs/songs.service.ts`

---

## Tổng quan

`SongsService` là lớp nghiệp vụ trung tâm của module bài hát. Nó điều phối toàn bộ luồng xử lý: từ tạo bài hát qua YouTube, phân trang danh sách, đến xóa và chuyển album.

### Tại sao bỏ CQRS, dùng Service trực tiếp?

Dự án ban đầu có thể dùng CQRS (Command/Query Responsibility Segregation) với các lớp `Command`, `CommandHandler`, `Query`, `QueryHandler` riêng biệt. Tuy nhiên với quy mô hiện tại (5 method đơn giản), CQRS tạo ra quá nhiều boilerplate mà không mang lại lợi ích rõ ràng:

- Mỗi thao tác cần 2–3 file thay vì 1 method
- Khó đọc hơn khi codebase còn nhỏ
- Overkill cho team nhỏ hoặc MVP

→ **Quyết định:** gộp tất cả vào `SongsService` một file, dễ đọc, dễ test.

---

## Constructor — 4 dependency

```typescript
constructor(
  private readonly songRepository: SongRepository,
  private readonly albumHelper: AlbumValidationHelper,
  @InjectQueue('conversion') private readonly conversionQueue: Queue,
  @InjectPinoLogger(SongsService.name) private readonly logger: PinoLogger,
) {}
```

| Dependency | Kiểu | Mục đích |
|---|---|---|
| `songRepository` | `SongRepository` | Truy vấn và ghi dữ liệu bài hát vào DB |
| `albumHelper` | `AlbumValidationHelper` | Validate album có tồn tại và thuộc user không |
| `conversionQueue` | `Queue` (BullMQ) | Đưa job chuyển đổi âm thanh vào hàng đợi |
| `logger` | `PinoLogger` (nestjs-pino) | Ghi log có cấu trúc JSON |

**Ghi chú về logger:** `@InjectPinoLogger(SongsService.name)` tạo ra một logger có tên là `"SongsService"` — khi xem log sẽ biết ngay message đến từ class nào mà không cần tra cứu.

---

## Pattern log: chỉ log khi bất thường

Đây là nguyên tắc quan trọng trong dự án này:

```typescript
// ❌ Sai — log ở đầu mỗi hàm, gây nhiễu
async findOne(userId, id) {
  this.logger.info('findOne called'); // không cần
  ...
}

// ✅ Đúng — chỉ log khi có điều bất thường xảy ra
async findOne(userId, id) {
  const song = await this.songRepository.findByUserAndId(userId, id);
  if (!song) {
    this.logger.warn({ userId, id }, 'Song not found or access denied'); // log khi fail
    throw new NotFoundException('Song not found');
  }
}
```

**Lý do:** Log thừa làm nhiễu loạn, khó tìm lỗi thực sự. Chỉ log khi:
- Luồng đi vào nhánh bất thường (cảnh báo, lỗi)
- Thao tác quan trọng diễn ra (tạo record, enqueue job)
- Race condition xảy ra

---

## Method 1: `createFromYoutube` — Logic deduplication 3 tầng

Đây là method phức tạp nhất trong service. Mục tiêu: đảm bảo cùng một YouTube URL không bị convert nhiều lần, tiết kiệm tài nguyên.

```typescript
async createFromYoutube(userId: string, dto: CreateSongYoutubeDto): Promise<SongResponseDto>
```

### Sơ đồ luồng

```
Nhận URL YouTube
    │
    ▼
validate album + extract youtubeId
    │
    ├─ youtubeId không hợp lệ → throw BadRequestException
    │
    ▼
[Tầng 1] findByYoutubeId — tìm track đã convert xong (url != '')
    │
    ├─ Tìm thấy → tạo record mới dùng lại URL storage → trả về ngay
    │
    ▼
[Tầng 2] findPendingByYoutubeId — tìm track đang pending (url == '')
    │
    ├─ Tìm thấy → tạo record mới link vào pending track → trả về ngay
    │
    ▼
[Tầng 3] Chưa có gì → tạo pending record (url = '')
    │
    ▼
Race check: findPendingByYoutubeId lần nữa
    │
    ├─ Tìm thấy record khác (thua race) → xóa record vừa tạo → trả về record thắng
    │
    ▼
Enqueue job conversion vào BullMQ → trả về pending song
```

### Chi tiết từng tầng

**Tầng 1 — Reuse bài đã convert xong:**
```typescript
const existingTrack = await this.songRepository.findByYoutubeId(youtubeId);
if (existingTrack) {
  // Tìm thấy → tạo bản ghi mới nhưng dùng lại URL file âm thanh đã có
  const reusedSong = await this.songRepository.create({
    data: {
      url: existingTrack.url,       // dùng lại URL storage
      duration: existingTrack.duration,
      artist: artist || existingTrack.artist,
      // ...
    },
  });
  return mapSongToResponse(reusedSong);
}
```
→ Không cần download/convert lại. File âm thanh đã tồn tại trên storage, chỉ tạo bản ghi DB mới trỏ vào cùng file.

**Tầng 2 — Reuse bài đang pending:**
```typescript
const pendingTrack = await this.songRepository.findPendingByYoutubeId(youtubeId);
if (pendingTrack) {
  // Có request khác đang convert cùng video → dùng chung kết quả
  const reusedSong = await this.songRepository.create({
    data: {
      url: pendingTrack.url,  // url = '' lúc này, sẽ được cập nhật khi job xong
      // ...
    },
  });
  return mapSongToResponse(reusedSong);
}
```
→ Không enqueue thêm job. Khi job của `pendingTrack` hoàn thành, worker sẽ cập nhật tất cả record có cùng `sourceId`.

**Tầng 3 + Race check:**
```typescript
const song = await this.songRepository.create({ data: { url: '', ... } });

// Kiểm tra lại: có request nào len lỏi vào giữa findPending và create không?
const raceCheck = await this.songRepository.findPendingByYoutubeId(youtubeId);
if (raceCheck && raceCheck.id !== song.id) {
  // Thua race → xóa record vừa tạo, dùng record của request thắng
  await this.songRepository.delete({ where: { id: song.id } });
  // ponytail: return winner's data, no new DB write needed
  return mapSongToResponse(raceCheck);
}

// Thắng race → enqueue job
await this.conversionQueue.add(CONVERSION_JOB.NAME, { url, songId: song.id, userId }, {
  jobId: `convert-${youtubeId}`,  // jobId unique → BullMQ tự dedup job
  attempts: CONVERSION_JOB.MAX_ATTEMPTS,
  backoff: { type: 'exponential', delay: CONVERSION_JOB.BACKOFF_DELAY_MS },
});
```

### Giải thích `url = ''` là pending state

Thay vì thêm cột `status ENUM('pending', 'completed', 'failed')`, dự án dùng:
- `url = ''` → đang chờ convert (pending)
- `url != ''` → đã convert xong, có URL thật

**Lợi ích:** Đơn giản hơn, không cần migration thêm cột, query dễ đọc hơn. Đây là "convention" của dự án — mọi người đọc code phải biết quy ước này.

---

## Method 2: `findAll` — Phân trang + filter song song

```typescript
async findAll(userId: string, paginationDto: PaginationDto)
```

```typescript
const where: any = { userId };
if (paginationDto.albumId) where.albumId = paginationDto.albumId; // filter theo album

const [total, songs] = await Promise.all([
  this.songRepository.count({ where }),
  this.songRepository.findAllByUser(userId, skip, limit, orderBy, where),
]);
```

### `Promise.all` chạy 2 query song song

Thay vì:
```typescript
// ❌ Tuần tự — tổng thời gian = thời gian query 1 + thời gian query 2
const total = await this.songRepository.count({ where });
const songs = await this.songRepository.findAllByUser(...);
```

Dùng:
```typescript
// ✅ Song song — tổng thời gian = max(thời gian query 1, thời gian query 2)
const [total, songs] = await Promise.all([...]);
```

Hai query `count` và `findMany` hoàn toàn độc lập nhau → chạy song song tiết kiệm thời gian đáng kể, đặc biệt khi DB ở xa (network latency).

### Comment ponytail trong `findAll`

```typescript
data: songs.map(mapSongToResponse), // ponytail: inline, no need for mapToResponseArray method
```

**`ponytail`** là convention đánh dấu các quyết định "giữ code nhỏ gọn chủ ý". Thay vì tạo thêm method `mapToResponseArray(songs)`, dùng `.map()` inline là đủ và rõ ràng hơn.

---

## Method 3: `findOne` — Security filter theo userId

```typescript
async findOne(userId: string, id: string): Promise<SongResponseDto> {
  const song = await this.songRepository.findByUserAndId(userId, id);
  if (!song) {
    this.logger.warn({ userId, id }, 'Song not found or access denied');
    throw new NotFoundException('Song not found');
  }
  return mapSongToResponse(song);
}
```

### Tại sao throw 404 thay vì 403?

Khi user A cố truy cập bài hát của user B:
- **403 Forbidden:** tiết lộ rằng resource đó *tồn tại* — hacker biết được ID hợp lệ
- **404 Not Found:** ẩn hoàn toàn sự tồn tại — resource "không tồn tại" với user hiện tại

→ Query `findByUserAndId` luôn filter `{ id, userId }` cùng lúc. Nếu bài hát tồn tại nhưng không thuộc user → trả về `null` → service throw 404. Đây là **security by design**.

---

## Method 4: `remove` — Cancel job nếu đang pending

```typescript
async remove(userId: string, id: string): Promise<void> {
  const song = await this.songRepository.findByUserAndId(userId, id);
  if (!song) throw new NotFoundException('Song not found');

  if (!song.url) {
    // ponytail: O(n) scan — BullMQ has no filter by job.data. Accept until queue grows large.
    const pendingJobs = await this.conversionQueue.getJobs(['waiting', 'delayed']);
    const relatedJob = pendingJobs.find((job) => job.data.songId === id);
    if (relatedJob) await relatedJob.remove();
  }

  await this.songRepository.delete({ where: { id } });
}
```

### Giải thích comment ponytail: `O(n) scan`

```typescript
// ponytail: O(n) scan — BullMQ has no filter by job.data. Accept until queue grows large.
```

**Vấn đề:** BullMQ không có API lọc job theo `job.data` (ví dụ: tìm job mà `data.songId === id`). Cách duy nhất là lấy toàn bộ job đang chờ rồi `.find()` — đây là O(n) với n = số job trong queue.

**Quyết định ponytail:** Chấp nhận O(n) vì hiện tại queue nhỏ. Đây không phải bug, mà là **kỹ nợ kỹ thuật được ghi nhận có chủ ý**. Khi queue lớn hơn, cần chuyển sang giải pháp khác (ví dụ: lưu `jobId` vào DB, dùng `queue.getJob(jobId)` trực tiếp).

**Lý do xóa job:** Nếu user xóa bài hát đang pending, không cần convert nữa. Giải phóng tài nguyên worker.

---

## Method 5: `moveToAlbum` — Validate cả bài và album

```typescript
async moveToAlbum(userId: string, id: string, dto: MoveSongDto): Promise<SongResponseDto> {
  // Bước 1: Validate bài hát thuộc user
  const song = await this.songRepository.findByUserAndId(userId, id);
  if (!song) throw new NotFoundException('Song not found');

  // Bước 2: Validate album thuộc user (hoặc albumId = null → bỏ khỏi album)
  const validatedAlbumId = await this.albumHelper.getValidatedAlbumId(userId, dto.albumId);

  // Bước 3: Cập nhật
  const updatedSong = await this.songRepository.update({
    where: { id },
    data: { albumId: validatedAlbumId },
  });

  return mapSongToResponse(updatedSong);
}
```

**Tại sao validate cả 2?** User có thể gửi `songId` hợp lệ nhưng `albumId` của người khác → nếu chỉ validate bài hát, sẽ chuyển bài vào album không thuộc mình. `AlbumValidationHelper.getValidatedAlbumId` đảm bảo album phải thuộc `userId`.

---

## Tóm tắt các pattern quan trọng

| Pattern | Áp dụng ở đâu | Mục đích |
|---|---|---|
| Deduplication 3 tầng | `createFromYoutube` | Không convert cùng video 2 lần |
| `url = ''` là pending | Toàn bộ module | Tránh thêm cột `status` |
| `Promise.all` | `findAll` | Chạy 2 query song song, giảm latency |
| Filter `userId` mọi query | `findOne`, `remove`, `moveToAlbum` | Security — không lộ data của user khác |
| Throw 404 thay vì 403 | `findOne`, `remove`, `moveToAlbum` | Không tiết lộ sự tồn tại của resource |
| Log chỉ khi bất thường | Toàn bộ service | Giảm nhiễu, dễ debug |
| Comment `ponytail` | `findAll`, `remove` | Đánh dấu kỹ nợ kỹ thuật có chủ ý |
