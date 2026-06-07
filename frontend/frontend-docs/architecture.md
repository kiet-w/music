# Frontend Architecture: Micro-Technical Documentation

Hệ thống Frontend được thiết kế theo kiến trúc Mobile-first, sử dụng Next.js làm nền tảng và Capacitor để chuyển đổi thành ứng dụng native.

---

## 1. Core Stack
- **Framework**: Next.js 14 (App Router).
- **Runtime**: Browser & Capacitor WebView.
- **Styling**: Tailwind CSS với hệ thống Design System dựa trên shadcn/ui.
- **Audio Engine**: Howler.js (HTML5 Audio backend).

---

## 2. API Communication Layer (`src/lib/api.ts`)

Toàn bộ việc giao tiếp với NestJS Backend được tập trung tại đây thông qua hàm `customFetch`.

### Centralized Fetch Logic
- **`customFetch(url, options)`**:
    - **Error Handling**: Tự động parse body lỗi từ backend. Nếu response không OK, nó trích xuất `message` và `code` (ví dụ: `ERR_CONFLICT`) để ném ra một Error object giàu thông tin.
    - **Auth Side Effects**: Nhận diện lỗi `401 Unauthorized` để có thể thực hiện logout hoặc redirect toàn cục.
    - **Header Injection**: Tự động thêm các headers bypass proxy (ngrok/tunnel) để đảm bảo kết nối ổn định trong môi trường dev.

### API Categories:
1. **Authentication**: `register`, `login`, `googleLogin`, `fetchMe`.
2. **Library Management**: `fetchAlbums`, `createAlbum`, `fetchTracks`, `moveTrackToAlbum`.
3. **Music Import**: `downloadFromYoutube`, `importFromDrive`.
4. **Social & Messaging**: `sendMessage`, `fetchChatHistory`, `createInvite`, `acceptInvite`.

---

## 3. Native Bridge (Capacitor)

Ứng dụng được cấu hình để chạy mượt mà trên thiết bị di động.

- **Static Export**: Cấu hình `next.config.js` với `output: 'export'`. Điều này cho phép Next.js tạo ra các tệp HTML/JS/CSS tĩnh, giúp Capacitor có thể đóng gói vào APK/IPA mà không cần server Node.js chạy runtime.
- **Filesystem Integration**: Sử dụng `@capacitor/filesystem` để lưu trữ nhạc MP3 trực tiếp vào bộ nhớ máy, cho phép nghe nhạc không cần kết nối internet.

---

## 4. Internationalization (i18n)

Sử dụng `next-intl` với cấu trúc thư mục `[locale]`.

- **Middleware-based Routing**: Tự động redirect người dùng dựa trên ngôn ngữ trình duyệt hoặc lựa chọn trước đó lưu trong Cookie/LocalStorage.
- **Build-time Optimization**: Sử dụng `generateStaticParams` để tạo sẵn các trang cho từng ngôn ngữ (`en`, `vi`), đảm bảo tốc độ load tức thì.

---

## 5. Security Considerations

- **Environment Variables**: Các thông tin nhạy cảm như `GOOGLE_CLIENT_ID` được prefix `NEXT_PUBLIC_` để có thể sử dụng ở client-side, nhưng các bí mật thực sự (Secret Keys) chỉ nằm ở Backend.
- **CORS Configuration**: Được thiết lập chặt chẽ ở Backend để chỉ cho phép Origin của Web/Mobile App truy cập.
- **Input Sanitization**: Sử dụng thư viện `lucide-react` cho icons và tránh sử dụng `dangerouslySetInnerHTML` để ngăn chặn tấn công XSS.
