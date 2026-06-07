# Frontend Pages & Routing: Micro-Technical Documentation

Hệ thống sử dụng Next.js App Router kết hợp với chiến lược định tuyến đa ngôn ngữ (localized routing) để phục vụ cả web và mobile.

---

## 1. Localized Routing Structure (`app/[locale]`)

Toàn bộ các trang nghiệp vụ đều được bọc trong folder `[locale]`.

### Route Definitions:
- **`drive/page.tsx`**: Trang trình duyệt file Google Drive. Sử dụng Server-side component để render khung và Client-side Hook để tương tác dữ liệu.
- **`albums/[id]/page.tsx`**: Trang chi tiết Album. Sử dụng Dynamic Route để trích xuất ID album từ URL.
- **`invite/[token]/page.tsx`**: Trang xử lý lời mời kết bạn. Token được gửi về Backend để xác thực ngay khi trang được mount.

---

## 2. Global Providers & Layout (`layout.tsx`)

File Layout đóng vai trò là "xương sống" cung cấp ngữ cảnh cho toàn bộ ứng dụng.

### The Provider Tree:
1. **`NextIntlClientProvider`**: Truyền dữ liệu ngôn ngữ (`en`/`vi`) xuống các component con.
2. **`GoogleAuthProvider`**: Khởi tạo SDK của Google.
3. **`ChatProvider`**: Duy trì kết nối WebSocket/Realtime cho tin nhắn.
4. **`AuthGate`**: Đây là thành phần bảo mật quan trọng nhất. Nó kiểm tra trạng thái đăng nhập. Nếu không hợp lệ, nó sẽ chặn render nội dung và thực hiện redirect về `/login` bằng `useRouter`.

### Optimization with Dynamic Imports:
- **`PlayerBar`** và **`BottomTabBar`** được load qua `dynamic(() => ..., { ssr: false })`.
- **Lý do**: Các thành phần này truy cập trực tiếp vào `window` (Howler, DOM APIs). Việc load chúng ở phía Server (SSR) sẽ gây ra lỗi `ReferenceError: window is not defined`.

---

## 3. Middleware Integration

Middleware (`src/middleware.ts`) can thiệp vào mọi request:
- **Locale Detection**: Tự động trích xuất ngôn ngữ từ Header `Accept-Language` nếu người dùng truy cập vào URL gốc (`/`).
- **Redirects**: Đảm bảo các URL không có locale (ví dụ: `/albums`) luôn được chuyển hướng về đúng phiên bản ngôn ngữ (ví dụ: `/vi/albums`).

---

## 4. Design Decision Rationale

- **Tại sao dùng App Router?**: Cho phép sử dụng React Server Components (RSC) để tối ưu dung lượng tệp JS gửi xuống trình duyệt, đồng thời cung cấp cơ chế Nested Layouts cực kỳ mạnh mẽ cho các ứng dụng có thanh điều hướng cố định (như Music Player).
- **Static Site Generation (SSG)**: Sử dụng `generateStaticParams` cho các route tĩnh giúp ứng dụng có thể export hoàn toàn thành các file HTML, phù hợp để đóng gói vào ứng dụng mobile qua Capacitor.
