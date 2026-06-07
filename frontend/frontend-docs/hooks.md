# Frontend Logic & Custom Hooks: Micro-Technical Documentation

Hệ thống sử dụng các Custom Hooks để tách biệt logic phức tạp khỏi UI, đồng thời tận dụng sức mạnh của Capacitor và Supabase để cung cấp các tính năng cao cấp như offline mode và realtime updates.

---

## 1. Google Drive Integration (`useGoogleDrive`)

Hook này quản lý toàn bộ luồng tương tác với Google Drive API từ phía Client.

### Cơ chế Tải Script (Singleton Pattern)
- **Problem**: Google API scripts (`gapi` và `google gsi`) cần thời gian tải và không nên tải trùng lặp khi người dùng nhấn nút nhiều lần.
- **Solution**: Sử dụng biến `googleScriptsPromise` nằm ngoài scope của Hook để lưu trạng thái tải toàn cục. Nếu một tiến trình tải đang chạy, mọi yêu cầu tiếp theo sẽ dùng chung `Promise` đó.

### Các phương thức chính:
- **`openPicker`**: Khởi tạo Google Picker để chọn file MP3.
    - **Logic**: Yêu cầu access token mới thông qua `tokenClient.requestAccessToken`, sau đó cấu hình `DocsView` chỉ hiển thị `audio/mpeg`.
- **`login`**: Redirect người dùng tới trang OAuth của Google (Server-side handled).
- **`listFiles`**: Duyệt file nhạc trực tiếp từ API của Backend (Server-side proxy).

---

## 2. Offline Storage (`useOfflineStorage`)

Hook này tận dụng Plugin `Filesystem` của Capacitor để quản lý việc tải và phát nhạc offline trên cả Web và Mobile.

### Cơ chế lưu trữ:
- **Thư mục**: `offline_music` nằm trong `Directory.Data` (vùng nhớ an toàn của app).
- **Quy trình tải**: 
    1. `fetch(url)` để lấy Blob dữ liệu.
    2. Chuyển Blob thành Base64 bằng `FileReader`.
    3. Ghi dữ liệu vào hệ thống file bằng `Filesystem.writeFile`.

### Local URI Resolution:
- **Native (Android/iOS)**: Sử dụng `Capacitor.convertFileSrc` để chuyển đường dẫn vật lý thành URL nội bộ mà trình duyệt (WebView) có thể hiểu được.
- **Web (Browser)**: Do hạn chế bảo mật, trình duyệt không cho phép truy cập file src trực tiếp. Hook giải quyết bằng cách đọc lại file (`Filesystem.readFile`) và trả về chuỗi `data:audio/mp3;base64,...`.

---

## 3. Real-time Subscription (`useSupabaseRealtime`)

Hook này cung cấp khả năng lắng nghe các thay đổi trong Database theo thời gian thực.

- **Impact**: Tự động cập nhật giao diện khi bài hát convert xong hoặc có tin nhắn mới.
- **Micro-Logic**:
    - **Unique Channels**: Mỗi subscription tạo ra một channel name duy nhất (`realtime:table:random_id`) để tránh xung đột khi chuyển trang nhanh.
    - **Ref-based Callback**: Sử dụng `useRef` cho callback để tránh việc Re-subscribe liên tục mỗi khi component re-render, giúp tối ưu hiệu năng và tránh lãng phí kết nối tới Supabase.
    - **Cleanup**: Luôn gọi `supabase.removeChannel` khi component unmount để giải phóng tài nguyên server.
