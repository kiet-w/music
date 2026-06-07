### Repository

BẮT BUỘC liệt kê và giải thích TẤT CẢ custom method.

**1. Inheritance & BaseRepository**
- `extends BaseRepository<...>`: Giải thích cơ chế kế thừa, những gì được nhận "miễn phí" từ base.
- Tại sao dùng Repository pattern thay vì gọi trực tiếp Prisma/TypeORM trong Service.

**2. Với TỪNG custom method:**
- Giải thích logic truy vấn: Tại sao dùng `findUnique` thay vì `findFirst`.
- Tham số truyền vào và kiểu dữ liệu trả về.
- Xử lý kết quả: Tại sao trả về `null` hoặc throw error ngay tại đây (nếu có).

**3. Cơ chế BaseRepository deep dive**
- Giải thích cách `super(prisma, prisma.model)` hoạt động.
- Generic types được sử dụng.

---
### Repository diagram [GHI VÀO FILE: -flows.md]

Vẽ luồng từ method call → Prisma operation → DB → return:
- Repository method
- Prisma operation cụ thể (findUnique, create, v.v.)
- DB table
- Return: User | null
