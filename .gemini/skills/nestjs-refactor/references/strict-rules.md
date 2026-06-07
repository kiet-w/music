# NestJS Senior Architectural Standards

## STRICT RULES — TUYỆT ĐỐI KHÔNG ĐƯỢC VI PHẠM

### 1. Private helper KHÔNG BAO GIỜ tách ra file riêng
Private = thuộc về class đó, chết cùng class đó. Nếu tách ra file riêng → buộc phải đổi thành public/exported → bất kỳ class nào cũng gọi được → mất hoàn toàn tính đóng gói.

### 2. KHÔNG tách nếu phá vỡ dependency injection chain
NestJS hoạt động theo DI container. Mỗi Injectable class phải được khai báo trong `providers[]` hoặc export/import đúng cách. Không tách nếu gây circular dependency hoặc tạo Injectable không cần thiết.

### 3. KHÔNG tách Controller method thành nhiều Controller
1 resource = 1 Controller. Chỉ tách khi base route khác nhau hoàn toàn.

### 4. KHÔNG tách DTO nếu chỉ dùng 1 nơi
Tránh tạo coupling không cần thiết qua inheritance. Chỉ tách BaseDto khi có >= 3 DTO extend cùng shape ổn định.

### 5. KHÔNG tách Repository thành nhiều Repository cho 1 table
1 table = 1 Repository. Chỉ tách khi đây là 2 table khác nhau.

### 6. KHÔNG di chuyển logic từ Service vào Repository
Repository KHÔNG được chứa business logic. Logic nghiệp vụ (như link account) nằm trong Service (private helper).

### 7. KHÔNG tách chỉ vì file dài
File 300 dòng rõ ràng tốt hơn 5 file 60 dòng khó trace. Tách khi: được dùng bởi >= 2 class, độc lập về domain, và làm TỪNG file dễ đọc hơn.

### 8. Liên kết bắt buộc phải giữ nguyên
- Guard ↔ Decorator
- DTO ↔ Validator decorator
- Service ↔ Private helpers
- Repository ↔ Prisma delegate
- Module ↔ providers/exports

---

## CHECKLIST TRƯỚC KHI ĐỀ XUẤT TÁCH
Trước khi suggest bất kỳ refactor nào, trả lời 5 câu hỏi này:
1. Logic này có được dùng bởi >= 2 class không? → Không → KHÔNG tách ra file mới.
2. Tách ra có tạo Injectable mới không cần thiết không? → Có → KHÔNG tách.
3. Tách ra có phá circular dependency không? → Có → KHÔNG tách.
4. Sau khi tách, method gốc có ngắn hơn VÀ dễ đọc hơn không? → Không → KHÔNG tách.
5. Tách ra có buộc phải đổi private thành public không? → Có → KHÔNG tách, giữ private trong class gốc.
