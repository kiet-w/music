# Frontend Components: Micro-Technical Documentation

Hệ thống UI được xây dựng dựa trên nguyên lý **Atomic Design**, kết hợp với `shadcn/ui` và `framer-motion` để tạo ra trải nghiệm người dùng mượt mà và nhất quán.

---

## 1. Component Hierarchy (Atomic Design)

### Atoms (Nguyên tử)
- **`src/components/atoms/ui/`**: Các thành phần UI nguyên bản từ `shadcn/ui` (Button, Dialog, Input, Slider). Chúng được tùy chỉnh CSS thông qua Tailwind để phù hợp với phong cách Dark Mode của ứng dụng.
- **Skeletons**: Sử dụng hiệu ứng `animate-pulse` của Tailwind để tạo placeholder khi dữ liệu đang tải.

### Molecules (Phân tử)
- **`PlayerBar`**: Component phức tạp nhất.
    - **Animation**: Sử dụng `AnimatePresence` của `framer-motion` để tạo hiệu ứng chuyển đổi mượt mà giữa Icon Play và Pause.
    - **Micro-interaction**: Ảnh bìa bài hát có hiệu ứng `scale` và `rotate` nhẹ nhàng khi đang phát nhạc, tạo cảm giác "sống động".
- **`AlbumsHeader`**: Tích hợp các nút chuyển đổi chế độ hiển thị (Grid/List) và nút hành động nhanh.

### Templates (Mẫu)
- **`MainContainer`**: Đảm bảo cấu trúc trang nhất quán với SafeArea cho mobile.
- **`MusicTemplate`**: Điều phối luồng giữa Tab YouTube và Drive, quản lý trạng thái hiển thị của các section tương ứng.

---

## 2. Animation & UX Strategy

Hệ thống sử dụng `framer-motion` cho toàn bộ các tương tác:
- **Page Transitions**: Các trang được bọc trong các thẻ `motion.div` với các thuộc tính `initial`, `animate`, và `exit` để tạo hiệu ứng mượt mà khi người dùng điều hướng.
- **Feedback**: Mọi nút bấm đều có `whileTap={{ scale: 0.95 }}` để cung cấp phản hồi hình ảnh tức thì cho người dùng trên màn hình cảm ứng.
- **Glassmorphism**: Sử dụng các lớp phủ mờ (`backdrop-blur`) kết hợp với border mỏng (`border-white/10`) để tạo chiều sâu cho giao diện mobile.

---

## 3. Design Decision Rationale

- **Tại sao dùng shadcn/ui?**: Cung cấp các component tuân thủ tiêu chuẩn Accessibility (A11y) và cho phép copy-paste source code trực tiếp vào dự án để tùy biến sâu mà không phụ thuộc vào thư viện bên thứ ba.
- **Mobile-First Constraints**: Mọi Layout đều sử dụng Flexbox/Grid của Tailwind với các đơn vị tương đối (percentage, vh, vw) để đảm bảo hiển thị đúng trên mọi kích thước màn hình từ iPhone SE đến các dòng màn hình lớn.
