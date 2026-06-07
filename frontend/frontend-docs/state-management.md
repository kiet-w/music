# Frontend State Management: Micro-Technical Documentation

Ứng dụng sử dụng **Zustand** làm giải pháp quản lý trạng thái tập trung. Các Store được chia theo tính năng để đảm bảo tính đóng gói và dễ dàng mở rộng.

---

## 1. Player Store (`usePlayerStore`)

Đây là store phức tạp nhất, quản lý toàn bộ vòng đời phát nhạc và tương tác với thư viện `Howler.js`.

### Logic Điều khiển Audio
- **`play(track, localUrl)`**: 
    - Giải phóng bộ nhớ của track cũ bằng `unload()`.
    - Ưu tiên sử dụng `localUrl` (file offline) nếu có, ngược lại dùng URL từ server.
    - Cấu hình `html5: true` cho Howl để hỗ trợ streaming các file lớn mà không cần tải hết vào RAM.
- **Timer Management**: 
    - Sử dụng `setInterval` (1000ms) để cập nhật `currentTime` từ phương thức `seek()` của Howler.
    - Tự động dừng (`stopTimer`) khi Pause hoặc Stop để tối ưu CPU.

---

## 2. Auth Store (`useAuthStore`)

Quản lý phiên làm việc và đồng bộ hóa với bộ nhớ trình duyệt.

### Hydration & Security
- **`hydrate()`**: Khi app khởi động, store tự động đọc dữ liệu từ `localStorage`. Nó thực hiện một bước kiểm tra quan trọng: gọi API `/auth/me` để xác thực token. Nếu token sai hoặc hết hạn, store sẽ gọi `clearSession()` để xóa sạch dấu vết.
- **User Scoped Reset**: Khi một người dùng logout hoặc switch account, store tự động gọi hàm reset của tất cả các store khác (`PlayerStore.reset()`, `AlbumStore.reset()`) để đảm bảo không có dữ liệu của người cũ sót lại trên giao diện.

---

## 3. Album Store (`useAlbumStore`)

Quản lý dữ liệu thư viện nhạc với cơ chế caching đơn giản.

- **Lazy Data Fetching**: Phương thức `loadAlbums` sử dụng cờ `isLoaded`. Nếu dữ liệu đã được tải một lần trong phiên làm việc, các lời gọi hàm tiếp theo sẽ bị bỏ qua, giúp giảm tải cho server và tăng tốc độ chuyển trang cho người dùng.

---

## 4. Design Decision Rationale

- **Tại sao dùng Zustand thay vì Redux?**: Ứng dụng tập trung vào trải nghiệm mobile và phát nhạc, yêu cầu sự nhẹ nhàng và ít boilerplate code. Zustand cung cấp API đơn giản và hiệu năng cực cao cho các tác vụ cập nhật liên tục (như Progress Bar).
- **Client-Side Only**: Tất cả các store được đánh dấu `'use client'` vì chúng phụ thuộc trực tiếp vào các Browser APIs (Web Audio, LocalStorage).
