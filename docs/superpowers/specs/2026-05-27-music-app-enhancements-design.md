# Thiết kế Cải tiến Trình phát Nhạc và Quản lý Bài hát

## 1. Mục tiêu
- Nâng cấp thanh thời gian (timeline) trong trình phát nhạc để dễ dàng cuộn và điều chỉnh.
- Thêm chức năng xóa bài hát trực tiếp từ danh sách.
- Thêm chức năng di chuyển bài hát sang các album khác nhau.
- Đảm bảo giao diện hỗ trợ đầy đủ tiếng Việt.

## 2. Giải pháp Kỹ thuật

### 2.1 Frontend (React/Next.js)

#### Trình phát Nhạc (Player.tsx)
- Thay thế `<input type="range">` cơ bản bằng một Slider tùy chỉnh (có thể dùng từ thư viện UI hiện có như Radix/Base-UI hoặc tự viết CSS).
- Tăng kích thước điểm kéo (thumb) khi di chuột vào hoặc đang kéo.
- Hiển thị phản hồi hình ảnh tức thì khi thay đổi vị trí bài hát.

#### Thư viện Bài hát (Library.tsx)
- Thêm hai nút bấm mới vào mỗi dòng bài hát:
  - **Nút Di chuyển (Move):** Sử dụng biểu tượng `FolderInput` hoặc `ArrowRightLeft`. Khi bấm sẽ mở một Dialog liệt kê danh sách các album để người dùng chọn.
  - **Nút Xóa (Delete):** Sử dụng biểu tượng `Trash2`. Khi bấm sẽ hiển thị một Dialog xác nhận xóa trước khi thực hiện.

#### Đa ngôn ngữ (Vietnamese)
- Cập nhật các file dịch thuật (`vi.json`) để bao gồm các từ khóa mới: "Xóa bài hát", "Di chuyển đến album", "Bạn có chắc chắn muốn xóa?", v.v.

### 2.2 Backend (NestJS/Prisma)

#### API Bài hát (Songs)
- **DELETE `/songs/:id`**: Xóa bài hát khỏi cơ sở dữ liệu.
- **PATCH `/songs/:id/move`**: Cập nhật `albumId` cho bài hát.

## 3. Quy trình Thực hiện

### Giai đoạn 1: Backend
- Cập nhật `SongController` và `SongService` để hỗ trợ xóa và di chuyển.
- Viết unit test cho các endpoint mới.

### Giai đoạn 2: Frontend - Thư viện Bài hát
- Cập nhật `Library.tsx` để hiển thị các nút chức năng mới.
- Tạo Component `MoveToAlbumDialog` và `DeleteConfirmDialog`.

### Giai đoạn 3: Frontend - Trình phát Nhạc
- Tùy chỉnh CSS và logic cho thanh thời gian trong `Player.tsx`.

### Giai đoạn 4: Việt hóa
- Cập nhật các file ngôn ngữ.

## 4. Kiểm thử
- Kiểm tra tính năng kéo thanh thời gian có mượt mà không.
- Kiểm tra xóa bài hát có cập nhật lại danh sách ngay lập tức không.
- Kiểm tra di chuyển bài hát sang album khác và xác nhận album đó đã chứa bài hát mới.
