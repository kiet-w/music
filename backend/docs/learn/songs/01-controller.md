# Controller & LoggingInterceptor

> Tầng HTTP — nhận yêu cầu, trích xuất người dùng, chuyển tiếp xuống tầng Service.

---

## SongsController

**File:** [`songs.controller.ts`](file:///home/baudui/Projects/project/music/backend/src/songs/songs.controller.ts)

```typescript
@ApiTags('songs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)            // tất cả endpoint đều cần JWT
@Controller('songs')
@UseInterceptors(ClassSerializerInterceptor)
export class SongsController {
  constructor(private readonly songsService: SongsService) {}
}
```

### Danh sách endpoint

| Decorator | Guard bổ sung | Phương thức | Mô tả |
|-----------|--------------|-------------|-------|
| `@Post('youtube')` | `@UseGuards(ThrottlerGuard)` | `createFromYoutube` | Giới hạn tốc độ — tối đa 10 yêu cầu/60 giây |
| `@Get()` | — | `findAll` | Lấy tất cả bài hát |
| `@Get(':id')` | — | `findOne` | Lấy một bài hát theo ID |
| `@Delete(':id')` | — | `remove` | Xóa bài hát |
| `@Patch(':id/move')` | — | `moveToAlbum` | Chuyển bài hát sang album khác |

### Decorator `@CurrentUser()`

```typescript
async createFromYoutube(
  @CurrentUser() user: AuthenticatedUser,  // trích xuất từ JWT
  @Body() dto: CreateSongYoutubeDto,
): Promise<SongResponseDto> {
  return this.songsService.createFromYoutube(user.id, dto);
}
```

`@CurrentUser()` là decorator tùy chỉnh, dùng để lấy thông tin người dùng từ `request.user` — đối tượng này được `JwtAuthGuard` gán vào sau khi xác thực token thành công.

### `@HttpCode(204)` trên endpoint xóa

```typescript
@HttpCode(204)
@Delete(':id')
async remove(...): Promise<void> {
  await this.songsService.remove(user.id, id);
}
```

Mã HTTP 204 nghĩa là "Không có nội dung" — xóa thành công nhưng không trả về dữ liệu. Đây là chuẩn đúng của REST.

### ThrottlerGuard chỉ áp dụng cho endpoint YouTube

```typescript
@Post('youtube')
@UseGuards(ThrottlerGuard)  // chỉ endpoint này mới có giới hạn tốc độ
```

Cấu hình trong `app.module.ts`:
```typescript
ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])
// Tối đa 10 yêu cầu trong 60 giây mỗi địa chỉ IP
```

**Tại sao chỉ áp dụng cho YouTube mà không phải tất cả?**

→ Tải nhạc từ YouTube tiêu tốn nhiều tài nguyên máy chủ: xử lý tải xuống, CPU, băng thông, ổ đĩa. Các thao tác đọc như `findAll`, `findOne` rất nhẹ, không cần giới hạn.

---

## LoggingInterceptor — Tự động ghi nhật ký mọi yêu cầu HTTP

**File:** [`common/interceptors/logging.interceptor.ts`](file:///home/baudui/Projects/project/music/backend/src/common/interceptors/logging.interceptor.ts)

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(@InjectPinoLogger('HTTP') private readonly logger: PinoLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const { method, url, query, params, body } = request;
    const userId = request.user?.id?.substring(0, 8) ?? 'anon';
    const now = Date.now();
    const entrypoint = `${className}.${handlerName}`;

    return next.handle().pipe(
      tap({
        next: () => {
          // Yêu cầu thành công
          this.logger.info(
            { method, url, duration, statusCode, userId, entrypoint, body: redact(body) },
            `✅ POST /songs/youtube → 201 (234ms) [SongsController.createFromYoutube] user=abc123`,
          );
        },
        error: (error) => {
          // Yêu cầu thất bại
          this.logger.error(
            { ..., error: error.message },
            `❌ GET /songs/bad → FAIL (5ms) [SongsController.findOne] user=abc123 | Song not found`,
          );
        },
      }),
    );
  }
}
```

**Ví dụ nhật ký thực tế:**
```
✅ GET /songs → 200 (12ms) [SongsController.findAll] user=abc123ef
✅ POST /songs/youtube → 201 (234ms) [SongsController.createFromYoutube] user=def456ab
❌ GET /songs/bad-id → FAIL (5ms) [SongsController.findOne] user=abc123ef | Song not found
```

### Hàm `redact()` — Ẩn dữ liệu nhạy cảm

```typescript
const sensitiveKeys = ['password', 'driveToken', 'accessToken', 'googleAccessToken', 'googleRefreshToken', 'token'];
// Nội dung body được che trước khi ghi nhật ký → không bao giờ lưu mật khẩu vào log
```

Bất kỳ trường nào trong danh sách trên sẽ bị thay bằng `[REDACTED]` trước khi ghi. Điều này đảm bảo dữ liệu nhạy cảm không bao giờ xuất hiện trong file nhật ký.

---

## 📚 Ghi chú học tập

### 🧠 Tại sao Controller không có logic gì?

```typescript
// Controller chỉ làm 3 việc:
async createFromYoutube(@CurrentUser() user, @Body() dto) {
  return this.songsService.createFromYoutube(user.id, dto);  // chuyển tiếp ngay
}
```

Không có logic nghiệp vụ, không có kiểm tra điều kiện — tất cả nằm trong Service.

**Lý do:** Controller chỉ là bộ chuyển đổi HTTP. Nếu sau này chuyển từ REST sang gRPC hoặc WebSocket, chỉ cần thay Controller, phần Service không cần thay đổi. Đây là nguyên tắc tách biệt tầng trách nhiệm.

---

### 🧠 LoggingInterceptor — Tại sao không ghi nhật ký trong Service?

`LoggingInterceptor` ghi nhật ký **mọi** yêu cầu HTTP một cách tự động — không cần thêm code vào từng endpoint.

Service chỉ ghi nhật ký **những gì Interceptor không biết được:**
- Xung đột dữ liệu nội bộ (trạng thái bên trong)
- URL YouTube không hợp lệ (logic nghiệp vụ)
- Công việc được đưa vào hàng đợi (tác dụng phụ ngầm)

→ Tránh ghi trùng lặp, tiết kiệm dung lượng lưu trữ nhật ký.

---

### 🧠 `ClassSerializerInterceptor` làm gì?

```typescript
@UseInterceptors(ClassSerializerInterceptor)
export class SongsController { }
```

Kết hợp với `@Expose()` trong DTO:
- Tự động gọi `class-transformer` trên dữ liệu phản hồi
- Chỉ các trường có `@Expose()` mới được đưa vào phản hồi
- Bảo vệ tránh rò rỉ các trường không mong muốn

**Thực tế trong dự án này:** `mapSongToResponse()` đã map thủ công đúng các trường cần thiết → `ClassSerializerInterceptor` ít tác dụng hơn. Tuy nhiên vẫn giữ lại để đảm bảo an toàn cho tương lai.

---

### 🧠 `userId.substring(0, 8)` trong nhật ký

```typescript
const userId = request.user?.id?.substring(0, 8) ?? 'anon';
```

UUID đầy đủ có 36 ký tự — quá dài để đọc trong nhật ký. Chỉ cần 8 ký tự đầu là đủ để nhận biết người dùng mà không làm nhật ký rối mắt.

```
user=550e8400          ← 8 ký tự, dễ đọc
so với
user=550e8400-e29b-41d4-a716-446655440000  ← 36 ký tự, quá dài
```

---

**Cập nhật lần cuối**: 2026-07-09 — Viết lại hoàn toàn bằng tiếng Việt
