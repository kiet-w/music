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

---

## 5. Cost-Aware Design (Chi Phí Biến Đổi Theo Input)

**Ở Music App**: Tác vụ nặng (download 1 video YouTube) có chi phí tài nguyên tương đối cố định (vài chục giây CPU) dù video dài hay ngắn.
**Ở AI Agent**: Chi phí **hoàn toàn phụ thuộc vào user**. Câu hỏi càng dài, context nạp vào càng nhiều, hoặc Agent tự động gọi tool quá nhiều lần (multi-step reasoning) thì số tiền (Token) bị trừ càng tăng phi mã.

**Pattern mới bắt buộc phải có**: **Cost Estimation / Budget Cap** trước khi cho chạy.
- Phải đếm token đầu vào (dùng thư viện như `tiktoken`) trước khi gửi qua API. Nếu vượt quá giới hạn tài khoản user (ví dụ tier Free chỉ được 2000 tokens/request), chặn ngay từ đầu thay vì gửi lên OpenAI rồi nhận lỗi.
- Giới hạn số vòng lặp suy luận (`maxSteps`). Nếu agent bị kẹt trong vòng lặp (gọi tool lỗi → thử lại gọi tool lỗi) và loop quá `maxSteps` (ví dụ 5 vòng) mà chưa ra đáp án, phải ép nó dừng để chống tốn tiền vô ích (Infinite Loop Agent).

---

## 6. Observability: Tracing Cho AI (Langfuse)

**Ở Music App (File 03)**: Bạn log đủ context (`userId`, `songId`, `duration`) để debug lỗi ở 2h sáng không cần SSH.
**Ở AI Agent**: Log HTTP thông thường là vô nghĩa. Bạn cần biết chính xác LLM đã "nghĩ" gì. Thông tin cần log khác hẳn:
- Prompt gốc đã nạp vào là gì?
- Model nào được gọi (GPT-4o hay Claude 3.5 Sonnet)? Temperature bao nhiêu?
- Tốn bao nhiêu Prompt Tokens, bao nhiêu Completion Tokens?
- Trong chuỗi suy luận 5 bước (multi-step), bước số 3 gọi Tool bị fail nguyên nhân vì sao?

**Công cụ giải quyết**: Đây là lúc các hệ thống LLM Tracing như **Langfuse** (đang dùng trong Project 1) toả sáng. Thay vì in log ra console, mọi tương tác với LLM được wrap lại và gửi về Langfuse để tạo thành một "Trace" hoàn chỉnh. 
> *Câu chuyện phỏng vấn ghi điểm*: "Thay vì đọc console.log hỗn loạn, tôi tích hợp Langfuse để visualize toàn bộ quá trình tư duy (reasoning trace) của Agent. Nhờ đó tôi phát hiện ra bước gọi Tool bị ảo giác (hallucination) truyền sai tham số, và tối ưu lại system prompt."
