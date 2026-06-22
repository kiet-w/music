# Testing Patterns — Chứng Minh Code Hoạt Động

> **Nguyên tắc**: 100% test coverage không có nghĩa là code không có bug. Test tốt là test kiểm chứng behavior (hành vi) và edge cases (trường hợp biên), không phải test từng dòng code.

---

## 1. Test Pyramid — Viết Test Nào Khi Nào?

Hệ thống nên có sự cân bằng:
- **Unit Test (Nhiều nhất)**: Nhanh, isolated. Mock DB, mock external services. Test business logic.
- **Integration Test (Vừa phải)**: Chậm hơn. Kết nối DB thật (thường dùng test containers). Test query phức tạp, transactions.
- **E2E Test (Ít nhất)**: Rất chậm. Gọi qua HTTP endpoint, chạy xuyên từ controller xuống DB thật. Test toàn bộ flow.

**Tại sao project Music App chủ yếu là Unit Test với Mock?**
- *Lý do có chủ đích*: Tốc độ và feedback loop nhanh. Unit test có thể chạy trên CI/CD mỗi lần push mất chưa tới vài giây.
- *Thiếu sót cần biết*: Khi logic phụ thuộc vào Prisma query phức tạp (như transaction, where filter nhiều cấp), unit test với mock repository sẽ bỏ qua việc database xử lý sai cú pháp hoặc bị lỗi constraint. Lúc này, bắt buộc phải có Integration Test. Khi phỏng vấn, nếu bị hỏi "tại sao không có integration test?", bạn cần nhận thức rõ sự đánh đổi này.

---

## 2. Mocking Strategy — Test Boundary Ở Đâu?

**Câu hỏi**: Tại sao mock `AlbumRepository` mà không mock thẳng `PrismaService`?

```typescript
// ❌ Mock ở tầng quá sâu (Prisma layer)
mockPrismaService.album.findFirst.mockResolvedValue(null);

// ✅ Mock ở tầng Repository (Domain layer)
mockAlbumRepository.findFirst.mockResolvedValue(null);
```

**Lý do**:
- **Tách biệt Data Access**: Service chỉ làm việc với Repository interface, nó không quan tâm bên dưới dùng Prisma, TypeORM hay Mongoose. 
- **Dễ maintain**: Nếu bạn nâng cấp Prisma hoặc thay đổi cú pháp query, chỉ cần sửa logic trong Repository và Integration test của repo đó. Unit test của Service không bị vỡ.
- **Bớt độ phức tạp**: Mock các đối tượng chained của Prisma (`prisma.album.findFirst().then(...)`) thường tốn công, tạo ra test code rất rối và brittle (dễ gãy).

---

## 3. Test Data Builders / Factory Pattern

Khi test phình to ra, việc setup data rác có thể chiếm 80% số dòng code trong một file test.

```typescript
// ❌ Setup inline — lặp lại ở mọi test, cực kỳ khó bảo trì khi schema DB thêm một cột bắt buộc
const mockUser = {
  id: 'uuid',
  email: 'test@test.com',
  passwordHash: 'hash',
  createdAt: new Date(),
};

// ✅ Factory pattern — tập trung default values, dễ override
export const UserFactory = {
  build: (overrides = {}): any => ({
    id: 'test-user-id',
    email: 'default@test.com',
    passwordHash: 'hashed',
    createdAt: new Date(),
    ...overrides,
  }),
};

// Cú pháp trong file spec trở nên rất gọn:
const normalUser = UserFactory.build();
const adminUser = UserFactory.build({ role: 'ADMIN' });
```

---

## 4. Coverage Có Ý Nghĩa Gì? Line vs Behavior

**100% Line Coverage không bắt được bug**:
```typescript
function divide(a: number, b: number) {
  return a / b;
}
// Nếu viết test: divide(4, 2) === 2. Coverage sẽ báo 100%. 
// Nhưng code có bug: divide(4, 0) trả về Infinity / Exception mà không có test nào cover.
```

**Test theo Behavior / Edge Case (giống trong file `album.service.spec.ts` của bạn)**:
- *Happy path*: Gọi tạo default album thì chạy thành công.
- *Edge case*: Tham số `userId` trống thì catch được lỗi hay validate.
- *Failure path*: Giả lập `P2002` (Unique Constraint Violation) ném ra từ DB → Test xem Prisma ném lỗi đó thì Service có fallback để query bằng `findFirst` thành công không (xử lý race condition).

**Interview Tip**: Khi phỏng vấn, đừng bao giờ khoe "em viết 100% test coverage". Hãy kể "em đã viết test để bao phủ các edge cases nguy hiểm như unique constraint violation khi hai user click cùng lúc, hoặc mock timeout từ third-party API".
