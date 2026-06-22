# Interview Patterns — Kể Câu Chuyện Kỹ Thuật, Không Liệt Kê Tên Công Nghệ

> **Nguyên tắc**: Interviewer không hỏi "bạn dùng JWT không?" — họ hỏi "kể tôi nghe lần bạn giải quyết vấn đề X". Đây là sự khác biệt giữa "liệt kê tech stack" và "kể câu chuyện kỹ thuật".

---

## Khung STAR Áp Dụng Cho Technical Storytelling

```
S - Situation:  Bối cảnh kỹ thuật — hệ thống đang có vấn đề gì?
T - Task:       Yêu cầu cụ thể — bạn cần giải quyết cái gì?
A - Action:     Giải pháp — bạn làm gì, tại sao chọn cách đó?
R - Result:     Kết quả — làm sao bạn biết nó đúng? (test, metric)
```

Không phải mọi câu đều phải đủ 4 phần, nhưng phải có **A (tại sao)** và **R (bằng chứng)**.

---

## 4 Câu Chuyện Nên Thuộc Lòng (Với Full STAR)

### Câu chuyện 1: JWT Schema Migration Không Gây Downtime

**Tình huống thường xảy ra**: "Bạn đã thêm RBAC vào hệ thống đang chạy như thế nào?"

**❌ Trả lời junior**:
> "Tôi thêm field `role` vào JWT payload và dùng `@Roles()` decorator."

**✅ Trả lời senior**:
> "Khi tôi thêm field `role` vào JWT, toàn bộ token cũ của user đang login sẽ không có field này. Nếu guard throw error khi `role` undefined, tất cả user đang login sẽ bị kick ra đồng thời — đó là incident.
>
> Tôi xử lý bằng cách dùng `payload.role ?? UserRole.USER` trong guard — nếu token cũ không có `role`, default về USER. Điều này nghĩa là rollout RBAC có thể deploy ngay mà không cần coordinated logout hay migration script. Token cũ tự nhiên hết hạn theo TTL bình thường, sau đó user login lại sẽ có token mới với `role`.
>
> Tôi verify điều này bằng cách viết test với token cũ format (không có `role` field) và confirm guard không throw, fallback đúng."

---

### Câu chuyện 2: Race Condition Default Album

**Tình huống thường xảy ra**: "Bạn đã từng gặp race condition chưa? Giải quyết như thế nào?"

**❌ Trả lời junior**:
> "Tôi dùng lock hoặc transaction."

**✅ Trả lời senior**:
> "Khi user đăng nhập lần đầu, hệ thống cần tạo default album. Nếu user click double hoặc frontend retry, 2 request đồng thời có thể cùng thấy 'chưa có album' và cùng INSERT — DB sẽ throw unique constraint violation vì album chỉ được tạo một lần.
>
> Giải pháp tôi dùng là 'optimistic create': thử INSERT trước, nếu catch `P2002` (unique constraint), query lại để lấy bản ghi mà request kia vừa tạo thành công. Pattern này tránh cần pessimistic lock (lock làm giảm throughput) và tận dụng DB constraint như safety net.
>
> Quan trọng hơn: tôi viết unit test cho scenario này — mock repository trả về `P2002` error rồi verify service fallback sang findOne query. Test này cover cả happy path và race condition path."

**Code pattern đáng nhớ**:
```typescript
async findOrCreateDefault(userId: string): Promise<Album> {
  try {
    return await this.albumRepository.create({
      data: { userId, name: 'Default', isDefault: true }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError 
        && error.code === 'P2002') {
      // Race condition: another request created it first
      return this.albumRepository.findFirst({
        where: { userId, isDefault: true }
      });
    }
    throw error;
  }
}
```

---

### Câu chuyện 3: SSRF Defense in Depth

**Tình huống thường xảy ra**: "Bạn bảo vệ hệ thống khỏi SSRF như thế nào?"

**❌ Trả lời junior**:
> "Tôi validate URL ở controller."

**✅ Trả lời senior**:
> "SSRF (Server-Side Request Forgery) là khi attacker trick server gọi đến internal service — ví dụ `http://169.254.169.254/` để lấy AWS metadata, hoặc `http://localhost:6379/` để tấn công Redis.
>
> Tôi validate YouTube URL ở 2 lớp độc lập: DTO layer (`IsYouTubeUrlConstraint` kiểm tra hostname) và service layer (`DownloaderService.download()` kiểm tra lại trước khi spawn yt-dlp). Lý do cần 2 lớp: nếu mai sau có ai gọi `DownloaderService` từ admin script, cron job, hay test fixture mà bỏ qua DTO, service vẫn an toàn.
>
> Nguyên tắc: 'Không tin input nào, dù đã được validate ở chỗ khác' — vì chỗ khác đó có thể bị bypass, bị thay đổi, hoặc bị gọi theo cách không ngờ tới."

---

### Câu chuyện 4: Cleanup-on-Failure (Không Leak Resource)

**Tình huống thường xảy ra**: "Làm sao bạn handle partial failure trong distributed system?"

**❌ Trả lời junior**:
> "Tôi dùng try/catch."

**✅ Trả lời senior**:
> "Trong pipeline download YouTube: download xong file MP3, upload lên storage, update DB. Nếu upload fail giữa chừng, tôi có file temp trên disk nhưng không có record trong DB — 'orphaned file'. Nếu update DB fail sau khi upload xong, tôi có file trên storage nhưng user không thấy track — 'zombie storage'.
>
> Với file temp: tôi gọi `cleanup(outputPath)` trong cả `try` block (sau success) và `catch` block (sau failure) — đảm bảo file temp không bao giờ tồn tại lâu dù pipeline thành công hay thất bại.
>
> Với orphaned jobs (nếu worker crash giữa chừng): có `CleanupService` chạy cron mỗi giờ, tìm jobs stuck >2h và file tạm >1h, dọn độc lập. Đây là self-healing mechanism — không cần human intervention khi worker chết đột ngột."

---

## Nhóm Patterns Theo Chủ Đề Phỏng Vấn

### Khi Được Hỏi Về Security

| Pattern | Câu trả lời ngắn |
|---------|------------------|
| Defense in depth | "Validate URL ở cả DTO lẫn service — không tin input dù đã validate chỗ khác" |
| Fail-closed | "CORS config thiếu → app crash, không chạy với CORS mở — chọn fail loud thay vì fail silent" |
| Secret redaction | "Token bị redact ở cả HTTP interceptor và pino logger — 2 lớp độc lập, một lớp bị config sai lớp kia vẫn che được" |
| AES-256-GCM | "Không chỉ encrypt (confidentiality) mà còn verify integrity qua authTag — GCM mode cho cả 2" |
| Token migration | "Lazy migration: token cũ tự động được encrypt khi đọc lần đầu — không cần script, không cần downtime" |

### Khi Được Hỏi Về Reliability

| Pattern | Câu trả lời ngắn |
|---------|------------------|
| Idempotency | "Check sourceId trùng trước download — 2 user paste cùng link YouTube, chỉ download 1 lần" |
| Graceful degradation | "JWT cũ không có `role` field → default về USER, không reject — rollout RBAC không gây mass logout" |
| Cleanup in finally | "Cleanup temp file trong cả success và failure path — không thể leak resource" |
| Self-healing cron | "Cron mỗi giờ dọn stuck jobs >2h và orphaned files >1h — không cần on-call khi worker crash" |
| Error classification | "Phân loại yt-dlp stderr: 'Video unavailable' → 404, 'Format not available' → 400, không phải luôn 500" |

### Khi Được Hỏi Về Architecture

| Pattern | Câu trả lời ngắn |
|---------|------------------|
| Queue-based processing | "Task nặng (download, transcode) đi qua BullMQ queue — HTTP return trong <100ms, không block" |
| Repository pattern | "BaseRepository generic với Prisma error mapping — mỗi service không cần lặp try/catch" |
| Interface injection | "`IStorageProvider` inject thay vì concrete class — đổi từ Supabase sang S3 chỉ cần class mới" |
| Thin controller | "Controller chỉ parse DTO và gọi service — không có business logic trong controller" |
| Denormalization | "`Track.userId` direct relation — query 'tất cả track của user' không cần join qua Album" |

---

## Điều Cần Tránh Trong Interview

### Đừng Liệt Kê Tech Stack Không Có Context

❌ "Tôi dùng NestJS, Prisma, BullMQ, Redis, JWT, Supabase..."

✅ "Tôi dùng BullMQ để tách async processing ra khỏi HTTP request, vì task download YouTube có thể mất 60s — nếu xử lý sync thì HTTP timeout sẽ kick user trước khi xong."

### Đừng Nói "Best Practice" Mà Không Biết Tại Sao

❌ "Tôi dùng repository pattern vì nó là best practice."

✅ "Tôi dùng repository pattern để tập trung Prisma error handling ở một chỗ — khi thêm module mới, service mới không cần lặp lại cùng một try/catch P2002→409, P2025→404."

### Đừng Bỏ Qua Phần "Làm Sao Biết Nó Đúng"

Interviewer muốn biết bạn verify solution của mình không, hay chỉ viết và hope for the best.

Luôn kết thúc câu chuyện bằng:
- "Tôi viết test cho edge case này..."
- "Tôi verify bằng cách..."
- "Tôi biết nó đúng vì..."

---

## 3-4 Câu Chuyện Sâu vs 28 Điểm Rải Rác

Bạn có 28 điểm tốt trong codebase. Trong 45 phút interview, bạn chỉ có thể kể được 3-4 câu chuyện sâu.

**Chọn theo nguyên tắc**:
1. Câu chuyện nào bạn hiểu rõ nhất (có thể trả lời follow-up questions)
2. Câu chuyện nào thể hiện nhiều nhất về tư duy kỹ thuật
3. Câu chuyện nào liên quan nhất đến role bạn apply

**Recommended 4 câu**:
1. JWT migration (reliability + backward compat)
2. Race condition default album (concurrency handling)
3. SSRF defense in depth (security thinking)
4. Queue-based async + cleanup on failure (system design + reliability)

Kể 4 câu này tốt hơn liệt kê 28 điểm qua loa.

---

## Phụ Lục: Các Câu Hỏi Conceptual Thường Gặp (Không phụ thuộc Code)

Ngoài việc trình bày pattern thực tế từ code, trong các buổi phỏng vấn Backend / AI Engineer, bạn luôn bị hỏi về conceptual knowledge (kiến thức tổng quan). Dưới đây là các câu trả lời gọn nhẹ nhất:

**1. Horizontal vs Vertical Scaling**
- *Vertical Scaling (Scale up)*: Nâng cấp CPU, RAM cho 1 server hiện tại. (Ưu điểm: Dễ làm, code không đổi. Nhược điểm: Có trần vật lý, single point of failure).
- *Horizontal Scaling (Scale out)*: Thêm nhiều server mới chạy song song qua Load Balancer. (Ưu điểm: Khả năng mở rộng vô hạn, chịu lỗi tốt. Nhược điểm: Phải giải quyết bài toán đồng bộ session, cache, race condition).

**2. CAP Theorem (Định lý CAP)**
Hệ thống phân tán không thể đạt được đồng thời cả 3: Consistency (Nhất quán), Availability (Sẵn sàng), Partition Tolerance (Chịu lỗi chia cắt mạng).
- *Thực tế*: P (Mạng có thể đứt) luôn tồn tại. Ta bắt buộc phải chọn C hoặc A.
- *Hệ thống tài chính (Banking)*: Chọn CP (Thà báo lỗi hệ thống không cho chuyển tiền còn hơn hiển thị sai số dư).
- *Mạng xã hội (Like/Comment)*: Chọn AP (Chấp nhận đếm sai số like một chút để người dùng luôn xem được bài viết không bị lỗi).

**3. Load Balancer Strategies**
- *Round-robin*: Xoay vòng lần lượt chia đều request (A → B → C → A). Tốt nhất khi các request tốn resource ngang nhau.
- *Least Connections*: Chia request cho server đang rảnh nhất. Tốt nhất khi có các request tốn thời gian chạy rất lâu (như AI processing), tránh việc 1 server phải gánh quá nhiều request nặng.

**4. SQL vs NoSQL**
- *SQL*: Dữ liệu có cấu trúc chặt chẽ, quan hệ rõ ràng (User có Album, Album có Track), bắt buộc phải có tính toàn vẹn ACID transaction.
- *NoSQL*: Dữ liệu unstructured (log files, JSON payload thay đổi liên tục từ API LLM trả về), cần ghi với tốc độ cực cao, hoặc cấu trúc thay đổi liên tục không xác định trước.
