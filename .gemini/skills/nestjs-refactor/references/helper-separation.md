# RULES CHI TIẾT: TÁCH PRIVATE HELPER

## PHẦN 1: PHÂN LOẠI PRIVATE HELPER
Trước khi quyết định tách, xác định helper thuộc loại nào:

**Loại A: Pure Logic Helper**
- Không có dependency nào. Chỉ transform data, format, calculate.
- Rule: KHÔNG tách, giữ private trong class gốc.

**Loại B: DB-Only Helper**
- Chỉ dùng `this.prisma` hoặc `this.someRepository`. Không có business rule.
- Rule: KHÔNG tách ra file riêng. Đặt thẳng vào Repository tương ứng dưới dạng method thường.

**Loại C: Validation + DB Helper**
- Dùng Repository + Logger. Có business rule (throw Exception), validate quyền truy cập.
- Rule: ĐƯỢC tách nếu >= 2 class cần dùng. Tách thành `@Injectable() Helper` class.

**Loại D: Business Logic Helper**
- Dùng dependency đặc thù của Service (JwtService, bcrypt, external API, ConfigService cho secrets).
- Rule: TUYỆT ĐỐI KHÔNG tách ra khỏi Service gốc.

## PHẦN 2: ĐIỀU KIỆN TÁCH LOẠI C
Phải thỏa ĐỦ 5 điều kiện:
1. **Usage count:** Được gọi bởi >= 2 class KHÁC NHAU.
2. **Dependency profile:** CHỈ được inject Repository, PinoLogger, hoặc Service khác. KHÔNG được dùng JwtService, bcrypt, external clients, ConfigService (secrets), MailService.
3. **Đặt tên được:** Format `[Domain][Purpose]Helper`. Ví dụ: `SongAccessHelper`.
4. **Đăng ký module được:** Không tạo circular dependency.
5. **Benefit rõ ràng:** Tiết kiệm >= 15-20 dòng thực chất và làm method gọi dễ đọc hơn.

## PHẦN 3: CẤU TRÚC FILE KHI TÁCH
- Helper thuộc domain nào → nằm trong folder domain đó: `src/[domain]/helpers/[name].helper.ts`.
- Không tạo folder helpers global ở root `src/`.

## PHẦN 4: TEMPLATE HELPER CLASS CHUẨN
```typescript
@Injectable()
export class SongAccessHelper {
  constructor(
    private readonly songRepository: SongRepository,
    private readonly albumRepository: AlbumRepository,
    @InjectPinoLogger(SongAccessHelper.name)
    private readonly logger: PinoLogger,
  ) {}

  async findAndValidateSong(userId: string, songId: string) {
    const song = await this.songRepository.findFirst({
      where: { id: songId, album: { userId } },
    });
    if (!song) throw new NotFoundException('Song not found');
    return song;
  }
}
```

## PHẦN 5: DẤU HIỆU NHẬN BIẾT TÁCH SAI
- Helper class chỉ có 1 method.
- Helper class cần inject JwtService hoặc bcrypt.
- Tách ra tạo circular dependency.
- Helper bị inject trực tiếp vào Controller.
- Helper file nằm ngoài domain folder.

## PHẦN 6: BẢNG QUYẾT ĐỊNH NHANH
1. Có dùng JwtService/bcrypt/API? → CÓ: Giữ trong Service gốc.
2. Chỉ transform data? → CÓ: Giữ private.
3. Chỉ gọi prisma, không throw? → CÓ: Đặt vào Repository.
4. Dùng bởi >= 2 class? → KHÔNG: Giữ trong Service gốc.
5. Tên rõ ràng + Không circular? → CÓ: **ĐƯỢC TÁCH**.

## PHẦN 7: VÍ DỤ THỰC TẾ
- `buildAuthResponse()` (Loại D): KHÔNG tách (jwtService).
- `hashPassword()` (Loại D): KHÔNG tách (bcrypt).
- `findAndValidateSong()` (Loại C): ĐƯỢC tách (nếu SongsService + DownloaderService dùng).
- `formatEmail()` (Loại A): KHÔNG tách.
