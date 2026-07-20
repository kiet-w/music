# Songs Module — Mục Lục

> Hướng dẫn đọc toàn bộ module Songs theo thứ tự. Bắt đầu từ đây.

---

## ⚠️ Lưu ý quan trọng

**Songs module đã được tái cấu trúc từ CQRS → Service trực tiếp.**
Không còn `CommandBus`, `QueryBus` hay thư mục Handler. Toàn bộ logic nghiệp vụ nằm trong `SongsService`.

> Các file `03-commands.md` và `04-queries.md` là **tài liệu lịch sử** — ghi lại phiên bản CQRS cũ để tham khảo, không phản ánh code hiện tại.

---

## Thứ tự đọc để hiểu module

| Thứ tự | File | Nội dung |
|--------|------|---------|
| 1 | [00-overview.md](./00-overview.md) | Kiến trúc tổng quan, cấu trúc thư mục, dependencies giữa các module |
| 2 | [01-controller.md](./01-controller.md) | HTTP layer, các endpoint, rate limiting, LoggingInterceptor |
| 3 | [02-service.md](./02-service.md) | **Phần quan trọng nhất** — createFromYoutube, findAll, remove, moveToAlbum |
| 4 | [05-repository.md](./05-repository.md) | Tầng database, BaseRepository, các câu truy vấn tùy chỉnh |
| 5 | [06-helpers.md](./06-helpers.md) | Hàm thuần túy (song-mapper) và Injectable helper (album-validation) |
| 6 | [07-dto.md](./07-dto.md) | DTO, custom validator `@IsYouTubeUrl`, hằng số, `as const` |
| 7 | [../jobs/](../jobs/) | Jobs module — phần 2 của luồng xử lý YouTube |

---

## File thực tế trong codebase

```
backend/src/songs/
├── songs.controller.ts              → 01-controller.md
├── songs.service.ts                 → 02-service.md  ⭐ Quan trọng nhất
├── songs.module.ts                  → 00-overview.md
├── repositories/
│   └── song.repository.ts           → 05-repository.md
├── helper/
│   ├── song-mapper.ts               → 06-helpers.md
│   └── album-validation.helper.ts   → 06-helpers.md
├── dto/
│   ├── create-song-youtube.dto.ts   → 07-dto.md
│   ├── move-song.dto.ts             → 07-dto.md
│   └── song-response.dto.ts         → 07-dto.md
└── constants/
    └── song.constants.ts            → 07-dto.md

backend/src/common/validators/
└── is-youtube-url.validator.ts      → 07-dto.md
```

---

## Các khái niệm chính đã học

### Kiến trúc & Luồng dữ liệu
- **Luồng tạo bài hát**: Controller → Service → Repository + Queue Job
- **`url = ''` = trạng thái pending** — không cần thêm cột `status` vào database
- **Chống trùng lặp 3 tầng** + `jobId` BullMQ = 4 lớp bảo vệ

### Validation
- **Validation 2 tầng**: DTO kiểm tra format → Service kiểm tra domain logic
- **Custom validator** `@IsYouTubeUrl()` — bảo vệ khỏi SSRF, whitelist 6 hostname YouTube
- **`@IsOptional()` vs bắt buộc** — `artist`, `albumId` có thể thiếu

### Thiết kế code
- **Hàm thuần túy vs Injectable** — `song-mapper` là hàm thuần, `album-validation` là service
- **`as const`** — narrow type sang literal, ngăn gán lại giá trị
- **Ponytail: constant 1 giá trị → xóa đi**, dùng string literal trực tiếp

### Bảo mật
- **Luôn filter theo `userId`** — không bao giờ trả dữ liệu người dùng khác
- **Throw 404 thay vì 403** — không tiết lộ sự tồn tại của tài nguyên người khác
- **`@Expose()` decorator** — kiểm soát chính xác field nào được trả về API

### Hiệu năng
- **`Promise.all`** — chạy các query song song thay vì tuần tự
- **Logger chỉ khi bất thường** — `LoggingInterceptor` đã cover HTTP, Service chỉ log race condition, cảnh báo, tác dụng phụ

---

## Ghi chú về các file cũ (CQRS)

| File | Trạng thái |
|------|-----------|
| [03-commands.md](./03-commands.md) | 📦 Lịch sử — phiên bản CQRS cũ |
| [04-queries.md](./04-queries.md) | 📦 Lịch sử — phiên bản CQRS cũ |
| [08-constants.md](./08-constants.md) | 📦 Lịch sử — đã gộp vào 07-dto.md |

---

**Cập nhật lần cuối**: 2026-07-09
