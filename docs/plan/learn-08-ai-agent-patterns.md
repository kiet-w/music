# AI Agent Patterns — Áp Dụng Bài Học Sang Project 1 (AI Research Agent)

> **Nguyên tắc**: Một AI Agent thực chất là một hệ thống backend gọi các external APIs cực kỳ đắt tiền (LLM tokens) và rất chậm (Search, Data Synthesis). Tất cả các system design patterns từ Music App đều tái sử dụng được, nhưng ở mức độ sinh tử đối với API cost và UX.

---

## 1. Streaming Response từ LLM

**Ở Music App**: Bạn dùng streaming buffer (pipe `fs.createReadStream` lên Supabase) để tránh tốn RAM khi file MP3 quá lớn.
**Ở AI Agent**: Phải stream text response trả về từ LLM (như OpenAI, Anthropic) thẳng về client qua Server-Sent Events (SSE) hoặc WebSocket.

**Tại sao cực kỳ quan trọng?** 
Một response từ LLM có thể mất từ 10 - 30 giây để sinh ra hết. Nếu bạn đợi LLM tạo xong cục text rồi mới trả HTTP response (như cách trả REST JSON bình thường), user sẽ tưởng app bị treo và thoát. SSE giúp UX có cảm giác "real-time" (từng chữ hiện ra) giống hệt trải nghiệm ChatGPT. Nguyên lý cốt lõi vẫn là: "Không buffer toàn bộ dữ liệu nặng trước khi trả về".

---

## 2. Idempotency cho LLM Calls (Cache Nâng Cao)

**Ở Music App**: Bạn đã dùng `sourceId` (ID của YouTube) làm khoá deduplicate để không bao giờ download cùng một video 2 lần.
**Ở AI Agent**: Dùng mã hash sinh ra từ (`Prompt Text` + `Context/Params`) làm Cache Key.

**Use Case Thực Tế**:
User nhập câu hỏi: *"Phân tích thị trường AI 2024"*.
- Lần 1: Backend nhận, gọi Tavily API search (tốn 1 credit) + LLM gộp nội dung (tốn 4000 tokens) → 15 giây.
- Lần 2: Một user khác nhập câu hỏi y hệt. Nếu bạn hash prompt ra `abc123hash`, cache hit trong Redis → Trả về đáp án ngay lập tức (10ms) và tốn **0 đồng**.

---

## 3. Rate Limiting Riêng Cho API AI

**Ở Music App**: Dùng ThrottlerModule để chống user spam 10 requests / phút.
**Ở AI Agent**: Phải có 2 tầng Rate Limiting:
- **Tầng 1 (User)**: Hạn chế tần suất spam từ IP (như cũ).
- **Tầng 2 (External API Budget)**: OpenAI/Anthropic giới hạn bạn theo Tokens Per Minute (TPM) hoặc Requests Per Minute (RPM) tuỳ tier account. Bạn bắt buộc phải track số token hệ thống đã tiêu thụ, nếu sắp chạm trần TPM, bạn phải đẩy request vào hàng đợi (Queue) thay vì nã API thẳng để bị OpenAI khoá IP trả về 429 Too Many Requests.

---

## 4. Timeout và Retry Strategy (Chống Cascading Failure)

**Ở Music App**: Dùng Queue (BullMQ) với exponential backoff để tải YouTube nếu network chập chờn.
**Ở AI Agent**: "Cascading Failure" rất dễ xảy ra.
- Nếu OpenAI timeout (chậm bất thường).
- Frontend tưởng request lỗi tự động retry.
- Server tiếp tục mở connection mới ném sang OpenAI.
- Kết quả: Account cạn tiền/token, backend server sập vì kiệt sức số lượng kết nối đang chờ phản hồi.

**Giải Pháp Sự Cố LLM (Saga/Outbox + Worker)**:
1. API nhận yêu cầu → Lưu dòng xuống DB trạng thái `PROCESSING` → Trả về `JobID` ngay cho client (Fast Path).
2. Worker đọc Job → Gọi LLM.
3. Nếu LLM trả mã lỗi 429 (Rate limit) hoặc 503 (Overloaded) → Worker tự đưa vào quá trình retry với *exponential backoff siêu lớn* (ví dụ: đợi 10s, 30s, 60s) thay vì liên tục cố gọi. Client lúc này polling/socket lắng nghe JobID đó để nhận status.
