### Service

BẮT BUỘC giải thích TẤT CẢ method (Public, Private, Protected). Không bỏ sót bất kỳ logic nội bộ nào.

**1. Constructor injection**
- Tại sao dùng `private readonly` không phải `public`.
- `@InjectPinoLogger` vs inject thông thường → tại sao logger cần decorator riêng.
- Dependency graph: Inject những gì từ module khác.

**2. Với TỪNG method (bao gồm cả Private Helpers):**
*Từng dòng code logic quan trọng, giải thích:*
- Tại sao `.toLowerCase()` hoặc các bước chuẩn hóa dữ liệu.
- `await` và xử lý bất đồng bộ: tại sao cần, rủi ro nếu thiếu.
- Các nhánh logic (if/else, switch): Trigger condition + Hậu quả.
- **Private Helper Methods**: Giải thích tại sao tách ra method riêng, chúng giúp gì cho việc tái sử dụng hoặc làm sạch code (clean code).
- Exception throwing:
  - Loại exception (Conflict, NotFound, BadRequest, v.v.).
  - Tại sao chọn exception đó.
  - Message và Status code trả về.
- Logic nghiệp vụ đặc thù (Business Rules).

**3. Tại sao logic nằm ở Service không phải Controller hay Repository**
- Service = Business Rules Layer.
- Ví dụ: Tại sao check quyền hạn hoặc validation nghiệp vụ phức tạp nằm ở đây.

---
### Service diagram [GHI VÀO FILE: -flows.md]

Vẽ luồng thực thi bên trong từng method:
- Bắt đầu từ method được gọi với params
- Mỗi await point là 1 node
- Mỗi branch if/else là diamond shape
- Exception throw là node kết thúc màu đỏ
- Return value là node kết thúc màu xanh
